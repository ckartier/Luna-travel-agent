import { redirect } from 'next/navigation';

type SearchParams = { lang?: string | string[] };

export default function SignupProRedirect({ searchParams }: { searchParams?: SearchParams }) {
  const lang = Array.isArray(searchParams?.lang) ? searchParams?.lang[0] : searchParams?.lang;
  const query = lang ? `&lang=${encodeURIComponent(lang)}` : '';
  redirect(`/signup?vertical=travel&mode=pro${query}`);
}
