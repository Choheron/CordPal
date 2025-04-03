
export default function Footer(props) {
  const currYear = new Date().getFullYear()

  return (
    <div className="w-full 2xl:w-3/4 mx-auto py-3 bg-gradient-to-r from-black/30 via-slate-800/25 to-black/30">
      <div className="flex flex-col w-fit mx-auto text-slate-500 text-center">
        <p>&copy; Copyright {currYear} -  Cord-Pal - All Rights Reserved</p>
        <div className="flex text-sm gap-1 justify-center">
          <p>
            Business Inquiries, reach out to
          </p>
          <a
            href="https://thomascampbell.dev"
            className="text-slate-400 italic hover:underline"
          >
            Thomas Campbell
          </a>
        </div>
      </div>
    </div>
  )
}