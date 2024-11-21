import { fetchUrl } from '@/features/arweave/lib/arweave';
import { DetailedAsset } from '../contract/model'; // Adjust the path as needed

interface AssetCardProps {
    asset?: DetailedAsset; // Make asset optional
}

export default function AssetCard({ asset }: AssetCardProps) {
    if (!asset) return null; // Return nothing if no asset

    return (
        <div className="relative w-full h-full object-cover">
            <img src={fetchUrl(asset.icon)} alt={asset.asset.Id}
                className="inset-0 w-full h-full object-cover" // Add these classes
            />
            {asset.asset.Quantity && parseInt(asset.asset.Quantity) > 1 && (
                <div className="absolute bottom-6 right-5 bg-gray-50 text-black text-xs px-2 py-1 rounded-full">
                    {asset.asset.Quantity}
                </div>
            )}
        </div>
    );
}