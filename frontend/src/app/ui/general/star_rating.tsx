// GUI Representation for a star rating system
// Expected Props:
// - rating: Float - Number rating out of 10 (incrments of 0.5)
// - textSize: String - Tailwind text size indicator
export default function StarRating(props) {
  const rating = (props.rating) ? Math.min(props.rating, 10) : 0;
  // Determine star ratios
  const fullStars = Math.floor(rating); // Number of full stars
  const partialStar = rating - fullStars; // Fractional part of the rating
  // Star array for display
  const stars: any = [];
  // Tailwind configs (Some can be passed in as props, otherwise defaulted)
  const filledColor = 'text-yellow-500'
  const emptyColor = 'text-gray-500'
  const textSize = (props.textSize) ? props.textSize : 'text-2xl';

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className={`${filledColor} ${textSize}`}>&#9733;</span>
    )
  }

  // Add partial star (with gradient) if there's a decimal value
  if (partialStar > 0) {
    stars.push(
      <>
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
            &#9733;
          </span>
          <span className={`${emptyColor}`}>&#9733;</span> {/* Empty part */}
        </span>
      </>
    );
  }

  // Add empty stars for the remaining stars to reach 10
  for (let i = fullStars + (partialStar > 0 ? 1 : 0); i < 10; i++) {
    stars.push(
      <span key={`empty-${i}`} className={`${emptyColor} ${textSize}`}>&#9733;</span>
    );
  }

  return <div className="flex items-center -mt-[6px]">{stars}</div>;

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