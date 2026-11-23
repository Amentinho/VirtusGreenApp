import { useAuth } from "@/hooks/use-auth";
import { Trophy, ArrowLeft, Medal } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Character } from "@shared/schema";
import TokenDisplay from "@/components/token-display";
import ProfileDropdown from "@/components/profile-dropdown";

type LeaderboardEntry = {
  userId: string;
  username: string | null;
  totalTokensEarned: number;
  currentCharacter: Character | null;
  rank: number;
};

const bg = { background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" };
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" };

export default function LeaderboardPage() {
  const { user } = useAuth();

  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const rankMedal = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-sm font-bold text-white/40">#{rank}</span>;
  };

  return (
    <div className="min-h-screen flex flex-col" style={bg}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-[72px] flex-none">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <img src="/logo.png" alt="VirtusGreen" className="h-8 w-auto object-contain brightness-0 invert" />
        </div>
        <div className="flex items-center gap-3">
          <TokenDisplay />
          <ProfileDropdown />
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-8 pb-16 max-w-2xl mx-auto w-full pt-8">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "rgba(192,250,121,0.12)" }}>
            <Trophy className="w-6 h-6 text-[#c0fa79]" />
          </div>
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Leaderboard
          </h1>
          <p className="text-white/45 text-sm mt-1">Top community members by tokens earned</p>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          {/* Header */}
          <div className="grid grid-cols-[48px_1fr_auto_56px] gap-3 px-5 py-3 border-b border-white/8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/30">Rank</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/30">Player</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/30 text-right">Tokens</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/30 text-center">Avatar</span>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-6 h-6 border-2 border-[#c0fa79]/40 border-t-[#c0fa79] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/40 text-sm">Loading…</p>
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((entry, idx) => {
              const isMe = entry.userId === user?.id;
              return (
                <div
                  key={entry.userId}
                  className="grid grid-cols-[48px_1fr_auto_56px] gap-3 items-center px-5 py-3.5 border-b border-white/5 last:border-0 transition-colors"
                  style={isMe ? { background: "rgba(192,250,121,0.07)", borderLeft: "2px solid #c0fa79" } : {}}
                  data-testid={isMe ? "row-current-user" : `row-user-${entry.userId}`}
                >
                  <div className="flex items-center justify-center">
                    {rankMedal(entry.rank)}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-white truncate" data-testid={`text-username-${entry.userId}`}>
                      {entry.username || "Anonymous"}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-bold bg-[#c0fa79] text-[#043231] px-1.5 py-0.5 rounded-full flex-none">You</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#c0fa79] text-right whitespace-nowrap" data-testid={`text-points-${entry.userId}`}>
                    {entry.totalTokensEarned.toLocaleString()}
                  </span>
                  <div className="flex justify-center">
                    {entry.currentCharacter ? (
                      <img
                        src={entry.currentCharacter.ipfsLink}
                        alt={entry.currentCharacter.title}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-white/15"
                        data-testid={`img-character-${entry.userId}`}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-white/25" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <Trophy className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No leaderboard data yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
