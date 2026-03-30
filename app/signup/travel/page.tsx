import { redirect } from 'next/navigation';

export default function SignupTravelRedirect() {
  redirect('/signup?vertical=travel');
}
