import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]"
      style={{
        backgroundImage: 'url("/back.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <main className="rounded-3xl p-5 bg-[#ffffff32] flex flex-col gap-8 items-center sm:items-start">
        <div className="bg-white p-10 rounded-3xl">
          <Image
            className="dark:invert bg-white rounded-xl"
            src="/logo.svg"
            alt="Next.js logo"
            width={380}
            height={38}
            priority
          />
          <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)] bg-white rounded-xl p-5">
            <li className="mb-2">Streamline with Intelligent APIs.</li>
            <li>Designed for students & schools.</li>
          </ol>
        </div>

    
      </main>
      <div className="flex justify-center gap-6 items-center mt-5">
          <Link
            href="/login"
            className="rounded-full bg-[#ffffff37] border border-solid border-white/[1] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 text-white hover:text-black"
          >
            Admin
          </Link>
          <Link
            href="/studentlogin"
            className="rounded-full bg-[#ffffff37] border border-solid border-white/[1] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 text-white hover:text-black"
          >
            Student
          </Link>
        </div>
    </div>
  );
}
