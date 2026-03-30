import { redirect } from 'next/navigation';

export default function SignupLegalRedirect() {
  redirect('/signup?vertical=legal');
}
