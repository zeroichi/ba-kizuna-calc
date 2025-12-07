import FavoriteIcon from '@mui/icons-material/Favorite';

interface BondRankProps {
  rank: number
}

const BondRank = (props: BondRankProps) => {
  return <div className="inline-block relative text-center w-6">
    <FavoriteIcon className="absolute top-0 left-0 text-red-200" fontSize="medium" />
    <span className="relative z-1 text-sm text-black">{props.rank}</span>
  </div>
}

export default BondRank
