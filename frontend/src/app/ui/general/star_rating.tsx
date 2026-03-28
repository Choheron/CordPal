import { IoStar, IoStarOutline } from 'react-icons/io5'

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
  const filledColor = (props.symbolColor) ? props.symbolColor : 'text-yellow-500'
  const emptyColor = 'text-gray-500'
  const textSize = (props.textSize) ? props.textSize : 'text-xl';

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <IoStar key={`full-${i}`} className={`${filledColor} ${textSize}`} />
    )
  }

  // Add partial star if there's a decimal value
  if (partialStar > 0) {
    stars.push(
      <span key="partial" className={`relative inline-block ${textSize}`}>
        <IoStarOutline className={`${emptyColor}`} />
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${partialStar * 100}%` }}>
          <IoStar className={`${filledColor}`} />
        </span>
      </span>
    );
  }

  // Add empty stars for the remaining stars to reach 10
  for (let i = fullStars + (partialStar > 0 ? 1 : 0); i < 10; i++) {
    stars.push(
      <IoStarOutline key={`empty-${i}`} className={`${emptyColor} ${textSize}`} />
    );
  }

  return <div className="flex justify-center flex-shrink-0 items-center leading-none">{stars}</div>;
}
