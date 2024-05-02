import Image from "next/image";

const Home = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-50">
      <header className="w-full max-w-5xl text-sm font-mono">
        <p className="mb-6 text-4xl font-bold">Welcome to NotionSync</p>
        <div className="flex justify-between items-center border-b border-gray-300 py-4">
          <span>
            Get started by editing <code>src/home.tsx</code>
          </span>
        </div>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
        <a
          href="https://nextjs.org/docs"
          className="p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
        >
          <h2 className="text-2xl font-semibold">Documentation &rarr;</h2>
          <p className="mt-2 text-base">
            Find in-depth information about Next.js features and API.
          </p>
        </a>
      </section>
    </main>
  );
};

export default Home;
