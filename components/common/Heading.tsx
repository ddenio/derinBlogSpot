interface HeadingProps {
  title: string;
  center?: boolean;
  lg?: boolean;
  md?: boolean;
}

const Heading = ({ title, center, lg, md }: HeadingProps) => {
  return (
    <div className={center ? "text-center" : "text-start"}>
      {lg && <h1 className="font-bold text-3xl sm:text-4xl my-2 break-words">{title}</h1>}
      {md && <h2 className="font-bold text-2xl sm:text-3xl my-2 break-words">{title}</h2>}
      {!lg && !md && <h3 className="font-bold text-xl sm:text-2xl my-2 break-words">{title}</h3>}
    </div>
  );
};

export default Heading;
