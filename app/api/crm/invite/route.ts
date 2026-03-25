export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { sendEmail } from '@/src/lib/gmail/api';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  const auth = await verifyAuth(request);
  if (auth instanceof Response) return auth;
  const paywall = await requireSubscription(auth, 'crm');
  if (paywall) return paywall;

  try {
    const { email, name, role = 'agent' } = await request.json();
    if (!email || !name) {
      return NextResponse.json({ error: 'email and name required' }, { status: 400 });
    }

    // Get the user's tenantId
    const userDoc = await adminDb.collection('users').doc(auth.uid).get();
    const tenantId = userDoc.exists ? userDoc.data()?.tenantId : null;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found for user' }, { status: 400 });
    }

    // Verify the user is admin/superadmin on this tenant
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const tenantData = tenantDoc.data();
    const memberInfo = tenantData?.members?.[auth.uid];
    const memberRole = (memberInfo?.role || '').toLowerCase();
    const isOwner = tenantData?.ownerId === auth.uid;
    if (!isOwner && !['admin', 'superadmin'].includes(memberRole)) {
      console.log(`[Invite] Permission denied for uid=${auth.uid}, role="${memberInfo?.role}", isOwner=${isOwner}`);
      return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 });
    }

    // Build invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/login?inviteTenant=${tenantId}&role=${role}`;

    // Build the branded HTML email
    const bodyHtml = `
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f1ed;padding:40px 20px;-webkit-font-smoothing:antialiased">
              <div style="text-align:center;margin-bottom:24px">
                <h1 style="margin:0;font-size:28px;font-weight:200;color:#2E2E2E;letter-spacing:6px">LUNA</h1>
                <p style="margin:4px 0 0;font-size:9px;color:#b9dae9;letter-spacing:3px;text-transform:uppercase;font-weight:600">Conciergerie de Voyage</p>
              </div>
              <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.06)">
                <div style="background:linear-gradient(135deg,#2E2E2E 0%,#3a3a3a 100%);padding:40px 32px;text-align:center">
                  <div style="display:inline-block;width:48px;height:48px;border-radius:50%;border:2px solid rgba(185,218,233,0.3);line-height:48px;text-align:center;margin-bottom:12px">
                    <span style="font-size:20px;color:#b9dae9">✉</span>
                  </div>
                  <h2 style="margin:0;color:white;font-size:22px;font-weight:300;letter-spacing:1px">Invitation à rejoindre Luna</h2>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:500">${role === 'admin' ? 'Administrateur' : 'Expert Voyage'}</p>
                </div>
                <div style="padding:40px 32px">
                  <p style="color:#2E2E2E;font-size:16px;line-height:1.7;margin:0 0 8px">Bonjour <strong>${name}</strong>,</p>
                  <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 24px">Vous avez été invité à rejoindre l'équipe Luna en tant que <strong style="color:#2E2E2E">${role === 'admin' ? 'Administrateur' : 'Expert'}</strong>. Une fois connecté, vous pourrez compléter votre profil et accéder à l'ensemble du CRM.</p>
                  <div style="background:#f4f8fa;border-radius:12px;padding:16px 20px;margin-bottom:28px;border-left:3px solid #b9dae9">
                    <p style="margin:0;font-size:12px;color:#2E2E2E;line-height:1.5"><strong>Ce que vous pourrez faire :</strong> Gérer les voyages, prestations, prestataires, devis, et bien plus depuis votre espace Luna.</p>
                  </div>
                  <div style="text-align:center;margin:32px 0 16px">
                    <a href="${inviteUrl}" style="display:inline-block;background:#2E2E2E;color:white;text-decoration:none;padding:16px 48px;font-size:12px;letter-spacing:3px;text-transform:uppercase;border-radius:8px;font-weight:600;box-shadow:0 4px 16px rgba(46,46,46,0.2)">Accepter l'invitation</a>
                  </div>
                  <p style="text-align:center;margin:0;font-size:10px;color:#ccc;line-height:1.5">Ou copiez ce lien :<br/><span style="font-size:10px;color:#b9dae9;word-break:break-all">${inviteUrl}</span></p>
                </div>
              </div>
              <div style="text-align:center;padding:24px 20px">
                <p style="margin:0;font-size:10px;color:#999">© ${new Date().getFullYear()} Luna — Conciergerie de Voyage. Tous droits réservés.</p>
              </div>
            </div>
        `;

    // Step 1: Send the invitation email via Gmail API
    let emailStatus = 'failed';
    try {
      await sendEmail({
        to: email,
        subject: `🚀 Invitation à rejoindre l'agence Luna - ${role === 'admin' ? 'Administrateur' : 'Expert'}`,
        bodyText: `Bonjour ${name},\n\nVous avez été invité à rejoindre l'agence Luna en tant que ${role === 'admin' ? 'Administrateur' : 'Expert'}.\n\nCliquez ici : ${inviteUrl}\n\nL'équipe Luna`,
        bodyHtml,
      });
      emailStatus = 'sent';
    } catch (mailErr: any) {
      console.error('[Invite] Email send failed:', mailErr.message);
      emailStatus = 'failed';
    }

    // Step 2: Add to tenant members using Admin SDK (bypasses security rules)
    const fakeUid = 'invited_' + Math.random().toString(36).substr(2, 9);
    await adminDb.collection('tenants').doc(tenantId).update({
      [`members.${fakeUid}`]: {
        role,
        email,
        displayName: name,
        status: 'invited',
        invitedBy: auth.uid,
        joinedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Step 3: Log the invitation in messages
    await adminDb.collection('tenants').doc(tenantId).collection('messages').add({
      clientId: email,
      clientName: name,
      channel: 'EMAIL',
      direction: 'OUTBOUND',
      recipientType: 'TEAM',
      content: `Invitation envoyée à ${name} (${email}) - Rôle: ${role}`,
      senderId: auth.uid,
      isRead: true,
      deliveryStatus: emailStatus,
      recipientEmail: email,
      createdAt: new Date(),
    });

    return NextResponse.json({
      status: emailStatus,
      message: emailStatus === 'sent'
        ? `Invitation envoyée avec succès à ${email}`
        : `Membre ajouté mais l'email n'a pas pu être envoyé`,
      memberId: fakeUid,
    });
  } catch (error: any) {
    console.error('[Invite] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
