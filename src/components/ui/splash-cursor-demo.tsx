
import { SplashCursor } from "@/components/ui/splash-cursor"

export function SplashCursorDemo() {
  return (
    <div>
      <SplashCursor />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Fluid Cursor Demo</h1>
          <p className="text-lg text-muted-foreground">
            Move your mouse around to see fluid dynamics in action
          </p>
        </div>
      </div>
    </div>
  )
}
