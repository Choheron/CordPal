// GUI Representation for a star rating system
// Expected Props:
// - rating: Float - Number rating out of 10 (incrments of 0.5)
// - textSize: String - Tailwind text size indicator
// - symbolOverride: String - A symbol to display instead of the star
export default function StarRating(props) {
  const rating = (props.rating) ? Math.min(props.rating, 10) : 0;
  // Determine star ratios
  const fullStars = Math.floor(rating); // Number of full stars
  const partialStar = rating - fullStars; // Fractional part of the rating
  // Star array for display
  const stars: any = [];
  // Override for character to display (must be in a html element)
  const symbol = (props.symbolOverride) ? props.symbolOverride : <>&#9733;</>
  // Tailwind configs (Some can be passed in as props, otherwise defaulted)
  const filledColor = (props.symbolColor) ? props.symbolColor : 'text-yellow-500'
  const emptyColor = 'text-gray-500'
  const textSize = (props.textSize) ? props.textSize : 'text-xl';

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className={`${filledColor} ${textSize}`}>{symbol}</span>
    )
  }

  // Add partial star (with gradient) if there's a decimal value
  if (partialStar > 0) {
    stars.push(
      <span key="partial" className={`relative ${textSize}`}>
        <span 
          className={`absolute inset-0 ${filledColor}`} 
          style={{
            width: `${partialStar * 100}%`,
            background: `linear-gradient(to right, #eab308, #eab308)`,
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}
        >
          {symbol}
        </span>
        <span className={`${emptyColor}`}>{symbol}</span> {/* Empty part */}
      </span>
    );
  }

  // Add empty stars for the remaining stars to reach 10
  for (let i = fullStars + (partialStar > 0 ? 1 : 0); i < 10; i++) {
    stars.push(
      <span key={`empty-${i}`} className={`${emptyColor} ${textSize}`}>{symbol}</span>
    );
  }

  return <div className="flex justify-center flex-shrink-0 items-center -mt-[6px]">{stars}</div>;

  // MY FIRST ITERATION 
  // const rating = (props.rating) ? Math.min(props.rating, 10) : 0;
  // const fullStars = Math.floor(rating)
  // const halfStars = (rating - Math.floor(rating) > 0) ? 1 : 0;

  // const getStars = () => {
  //   let stars: any = []
  //   for(let i = 0; i < fullStars; i++) {
  //     stars.push(
  //       <IoStar key={`full-${i}`}/>
  //     )
  //   }
  //   if(halfStars !+ 0) {
  //     stars.push(
  //       <IoStarHalf key={`half`}/>
  //     )
  //   }
  //   for(let i = 0; i < 10 - (fullStars + halfStars); i++) {
  //     stars.push(
  //       <IoStarOutline  key={`empty-${i}`}/>
  //     )
  //   }
  //   return stars;
  // }

  // return (
  //   <div className={`flex ${props.className}`}>
  //     {getStars()}
  //   </div>
  // );
}