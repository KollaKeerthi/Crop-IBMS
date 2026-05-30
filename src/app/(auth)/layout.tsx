import { Leaf } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left - blue gradient branding panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-gradient-to-br from-[#023e5a] via-[#036d96] to-[#048FC2] flex-col items-center justify-center p-12">
        <div className="text-white space-y-8 max-w-sm w-full">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5">
              <Leaf className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Crop Management</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight">Smart farming starts here.</h1>
            <p className="text-white/75 text-lg leading-relaxed">
              Manage crops, plan seasons, track tasks, and analyse performance - all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {["Crop planning", "Task management", "Team collaboration", "Real-time insights"].map(
              (f) => (
                <div
                  key={f}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white/90 font-medium"
                >
                  {f}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right - form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-background">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="rounded-lg bg-primary p-1.5">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">Crop Management</span>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
