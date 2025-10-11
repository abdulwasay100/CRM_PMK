import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { soundNotification } from '@/lib/sound-notification';

export function SoundSettings() {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    setIsEnabled(soundNotification.isSoundEnabled());
  }, []);

  const toggleSound = (enabled: boolean) => {
    if (enabled) {
      soundNotification.enable();
    } else {
      soundNotification.disable();
    }
    setIsEnabled(enabled);
  };

  const testSound = (type: 'success' | 'error' | 'warning' | 'info' | 'reminder') => {
    soundNotification.playNotification(type);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          Sound Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-toggle">Enable Sound Notifications</Label>
          <Switch
            id="sound-toggle"
            checked={isEnabled}
            onCheckedChange={toggleSound}
          />
        </div>

        {isEnabled && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Test Sounds:</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('success')}
                className="flex items-center gap-2"
              >
                <Play className="w-3 h-3" />
                Success
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('error')}
                className="flex items-center gap-2"
              >
                <Play className="w-3 h-3" />
                Error
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('warning')}
                className="flex items-center gap-2"
              >
                <Play className="w-3 h-3" />
                Warning
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('info')}
                className="flex items-center gap-2"
              >
                <Play className="w-3 h-3" />
                Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('reminder')}
                className="flex items-center gap-2"
              >
                <Play className="w-3 h-3" />
                Reminder
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Sound notifications will play when you create, update, or delete leads and groups.
        </div>
      </CardContent>
    </Card>
  );
}
