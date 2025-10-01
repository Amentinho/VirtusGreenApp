import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Calendar, Coins, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";

interface LoginStreakDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streakData: {
    weekDays: Array<{
      day: string;
      date: Date;
      loggedIn: boolean;
      tokens: number;
    }>;
    consecutiveDays: number;
    totalTokensThisWeek: number;
  } | null;
  todayReward: {
    tokensAwarded: number;
    consecutiveDays: number;
    isNewLogin: boolean;
  } | null;
}

export function LoginStreakDialog({ open, onOpenChange, streakData, todayReward }: LoginStreakDialogProps) {
  const { t } = useTranslation();

  if (!streakData) return null;

  const getStreakColor = (consecutiveDays: number) => {
    if (consecutiveDays >= 7) return "from-yellow-400 to-orange-500";
    if (consecutiveDays >= 4) return "from-green-400 to-emerald-500";
    if (consecutiveDays >= 2) return "from-blue-400 to-cyan-500";
    return "from-gray-400 to-gray-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-login-streak">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="h-6 w-6 text-emerald-600" />
            {t('loginStreak.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Welcome Message */}
          {todayReward && todayReward.isNewLogin && (
            <div className={`bg-gradient-to-r ${getStreakColor(todayReward.consecutiveDays)} text-white p-4 rounded-lg shadow-md`}>
              <p className="font-bold text-lg">{t('loginStreak.welcomeBack')}</p>
              <p className="text-white/90">{t('loginStreak.earnedToday', { tokens: todayReward.tokensAwarded })}</p>
              <p className="text-white/95 mt-2 text-sm italic">
                {t(`loginStreak.motivation${todayReward.consecutiveDays}`)}
              </p>
            </div>
          )}

          {todayReward && !todayReward.isNewLogin && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-gray-700 dark:text-gray-300">{t('loginStreak.alreadyLoggedIn')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('loginStreak.comeBackTomorrow')}</p>
            </div>
          )}

          {/* Weekly Calendar */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">{t('loginStreak.subtitle')}</h3>
            <div className="grid grid-cols-7 gap-2">
              {streakData.weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`relative p-3 rounded-lg text-center transition-all ${
                    day.loggedIn
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                  data-testid={`streak-day-${day.day.toLowerCase()}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {day.loggedIn ? (
                      <CheckCircle2 className="h-5 w-5" data-testid={`icon-checked-${day.day.toLowerCase()}`} />
                    ) : (
                      <Circle className="h-5 w-5" data-testid={`icon-unchecked-${day.day.toLowerCase()}`} />
                    )}
                    <span className="text-xs font-semibold">{t(`days.${day.day.toLowerCase()}`)}</span>
                    <span className="text-[10px] opacity-75">{format(day.date, 'MMM d')}</span>
                    {day.loggedIn && day.tokens > 0 && (
                      <span className="text-xs font-bold mt-1">+{day.tokens}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('loginStreak.currentStreak')}</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-consecutive-days">
                {streakData.consecutiveDays}/7
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('loginStreak.consecutiveDays', { count: streakData.consecutiveDays })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('loginStreak.totalThisWeek')}</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-total-tokens">
                {streakData.totalTokensThisWeek}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('loginStreak.tokensEarned')}</p>
            </div>
          </div>

          {/* Reward Structure */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{t('loginStreak.rewards')}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  className={`p-2 rounded ${
                    streakData.consecutiveDays >= day
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                  data-testid={`reward-day-${day}`}
                >
                  {t(`loginStreak.day${day}`)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
