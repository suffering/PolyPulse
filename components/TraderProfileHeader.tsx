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
    <header className="border border-slate-700/50 rounded-lg bg-slate-900/30 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex-shrink-0">
          <div className="h-24 w-24 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-2xl text-slate-400">
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
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
            {displayName}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(walletAddress);
                } catch {
                  const textArea = document.createElement("textarea");
                  textArea.value = walletAddress;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand("copy");
                  document.body.removeChild(textArea);
                }
              }}
              className="text-sm text-slate-400 font-mono hover:text-amber-400 transition-colors"
              title={`Click to copy: ${walletAddress}`}
            >
              {truncateWallet(walletAddress)}
            </button>
          </div>

          {xUsername && (
            <a
              href={`https://x.com/${xUsername.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-400 hover:text-amber-400 mb-4 block"
            >
              @{xUsername.replace(/^@/, "")}
            </a>
          )}

          <a
            href={polymarketProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium"
          >
            View on Polymarket →
          </a>
        </div>
      </div>
    </header>
  );
}
