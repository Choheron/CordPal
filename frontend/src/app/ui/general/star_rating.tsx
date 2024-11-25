import { IconContext } from "react-icons";

import { IoStarOutline, IoStarHalf, IoStar } from "react-icons/io5";

// GUI Representation for a star rating system
// Expected Props:
// - rating: Float - Number rating out of 10 (incrments of 0.5)
export default function StarRating(props) {
  const rating = (props.rating) ? Math.min(props.rating, 10) : 0;
  const fullStars = Math.floor(rating)
  const halfStars = (rating - Math.floor(rating) > 0) ? 1 : 0;

  const getStars = () => {
    let stars: any = []
    for(let i = 0; i < fullStars; i++) {
      stars.push(
        <IoStar key={`full-${i}`}/>
      )
    }
    if(halfStars !+ 0) {
      stars.push(
        <IoStarHalf key={`half`}/>
      )
    }
    for(let i = 0; i < 10 - (fullStars + halfStars); i++) {
      stars.push(
        <IoStarOutline  key={`empty-${i}`}/>
      )
    }
    return stars;
  }

  return (
    <div className={`flex ${props.className}`}>
      {getStars()}
    </div>
  );
}