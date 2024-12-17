import { DetailedAsset } from '../contract/model'; // Adjust the path as needed
import AssetCard from './AssetCard';

interface ProfileAssetsDisplayProps {
    assets: DetailedAsset[];
}

export default function ProfileAssetsDisplay({ assets }: ProfileAssetsDisplayProps) {
    const totalCells = Math.max(4, Math.ceil(assets.length / 4) * 4);

    return (
        <div className={`grid grid-cols-4 gap-4 ${assets.length === 0 ? 'p-2' : ''}`}>
            {[...Array(totalCells)].map((_, index) => (
                <div
                    key={index}
                    className="border border-gray-300 aspect-square" // Use Tailwind's aspect-square utility
                >
                    {assets[index] && <AssetCard asset={assets[index]} />}
                </div>
            ))}
        </div>
    );
}
