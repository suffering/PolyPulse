"use client";

interface TraderProfileHeaderProps {
  userName: string | null;
  profileImage: string | null;
  walletAddress: string;
  xUsername: string | null;
}

function truncateWallet(wallet: string): string {
  if (!wallet || wallet.length < 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function TraderProfileHeader({
  userName,
  profileImage,
  walletAddress,
  xUsername,
}: TraderProfileHeaderProps) {
  const displayName = userName || truncateWallet(walletAddress);
  const polymarketProfileUrl = `https://polymarket.com/profile/${walletAddress}`;

  return (
    <header className="w-full border border-[#1a1a2e] rounded-xl bg-[#0d0d14] p-6 mb-5 flex items-center gap-6">
      {/* Avatar */}
      <div className="flex-shrink-0 h-20 w-20 rounded-full bg-[#0a0a12] border border-[#1a1a2e] overflow-hidden flex items-center justify-center text-xl font-mono text-white/30">
        {profileImage ? (
          <img
            src={profileImage}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{walletAddress.slice(2, 4).toUpperCase()}</span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <p className="text-xs font-mono text-white/30 tracking-wide">
          {truncateWallet(walletAddress)}
        </p>
        {xUsername && (
          <a
            href={`https://x.com/${xUsername.replace(/^@/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors"
          >
            @{xUsername.replace(/^@/, "")}
          </a>
        )}
      </div>

      {/* CTA */}
      <a
        href={polymarketProfileUrl}
        target="_blank"
        rel="noreferrer"
        className="flex-shrink-0 inline-flex items-center px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400/20 transition-colors text-xs font-semibold tracking-wide"
      >
        View on Polymarket →
      </a>
    </header>
  );
}
