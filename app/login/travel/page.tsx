import { redirect } from 'next/navigation';

export default function LoginTravelRedirect() {
  redirect('/login?vertical=travel');
}
