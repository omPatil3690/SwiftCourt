import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./ui/select";
import { Calendar } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const Hero = () => {
  const { toast } = useToast();

  const onSearch = () => {
    toast({ title: 'Searching venues', description: 'Fetching live availability near you...' });
  };

  return (
    <section className="container mx-auto px-4 pt-16 pb-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">Book local courts in real-time</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Live slot availability, instant updates, and a smooth checkout experience for every sport.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="mt-8">
        <div className="glass-panel rounded-2xl p-4 md:p-6 shadow-[var(--shadow-elegant)]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Location (e.g., India)" aria-label="Location" />
            <Select>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sport" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tennis">Tennis</SelectItem>
                <SelectItem value="badminton">Badminton</SelectItem>
                <SelectItem value="basketball">Basketball</SelectItem>
                <SelectItem value="soccer">Soccer</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Calendar className="opacity-70" />
              <Input type="date" aria-label="Date" />
            </div>
            <Button
              variant="hero"
              className="rounded-xl text-shadow-sm"
              aria-label="Search court availability"
              onClick={onSearch}
            >
              Search availability
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
