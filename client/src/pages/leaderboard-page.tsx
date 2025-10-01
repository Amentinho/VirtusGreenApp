import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Character } from "@shared/schema";

type LeaderboardEntry = {
  userId: string;
  username: string | null;
  totalTokensEarned: number;
  currentCharacter: Character | null;
  rank: number;
};

export default function LeaderboardPage() {
  const { user } = useAuth();

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="ml-4 flex items-center">
              <img src="/logo.jpg" alt="VirtusGreen" className="h-12 w-auto" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Community Members</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading leaderboard...</p>
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rank</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead className="text-right">Total Points Earned</TableHead>
                      <TableHead className="w-32 text-center">Character</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry) => {
                      const isCurrentUser = entry.userId === user?.id;
                      return (
                        <TableRow 
                          key={entry.userId}
                          className={isCurrentUser ? "bg-green-50 border-2 border-green-500" : ""}
                          data-testid={isCurrentUser ? "row-current-user" : `row-user-${entry.userId}`}
                        >
                          <TableCell className="font-medium" data-testid={`text-rank-${entry.rank}`}>
                            {entry.rank === 1 && <span className="text-yellow-500">🥇</span>}
                            {entry.rank === 2 && <span className="text-gray-400">🥈</span>}
                            {entry.rank === 3 && <span className="text-orange-600">🥉</span>}
                            {entry.rank > 3 && <span>#{entry.rank}</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span data-testid={`text-username-${entry.userId}`}>
                                {entry.username || "Anonymous"}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold" data-testid={`text-points-${entry.userId}`}>
                            {entry.totalTokensEarned} points
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.currentCharacter ? (
                              <div className="flex justify-center">
                                <img
                                  src={entry.currentCharacter.ipfsLink}
                                  alt={entry.currentCharacter.title}
                                  className="w-10 h-10 rounded-full object-cover"
                                  title={entry.currentCharacter.title}
                                  data-testid={`img-character-${entry.userId}`}
                                />
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No character</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No leaderboard data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
