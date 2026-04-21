import React from "react";
import { Button } from "@/components/ui/button";

export type Slot = { time: string; available: boolean };

const SlotPicker = ({ slots, onSelect }: { slots: Slot[]; onSelect: (slot: Slot) => void }) => {
  const [liveSlots, setLiveSlots] = React.useState<Slot[]>(slots);

  React.useEffect(() => {
    const id = setInterval(() => {
      setLiveSlots(prev => {
        const copy = [...prev];
        const idx = Math.floor(Math.random() * copy.length);
        copy[idx] = { ...copy[idx], available: !copy[idx].available };
        return copy;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      {liveSlots.map((s) => (
        <Button key={s.time} variant={s.available ? 'pill' : 'secondary'} disabled={!s.available} onClick={() => onSelect(s)}>
          {s.time}
        </Button>
      ))}
    </div>
  );
};

export default SlotPicker;
