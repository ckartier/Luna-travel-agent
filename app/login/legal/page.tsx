import { redirect } from 'next/navigation';

export default function LoginLegalRedirect() {
  redirect('/login?vertical=legal');
}
