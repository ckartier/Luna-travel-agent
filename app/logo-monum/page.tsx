import MonumWordmark from '@/src/components/branding/MonumWordmark';

export default function MonumLogoAnimatedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6">
      <MonumWordmark className="w-full max-w-[720px]" animate strokeWidth={2.6} />
    </main>
  );
}
