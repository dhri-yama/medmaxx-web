"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

// The 3D scene only runs in the browser.
const HandsScene = dynamic(() => import("./HandsScene"), { ssr: false });

// If WebGL is unavailable the page simply shows no artwork instead of breaking.
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HandsBackdrop() {
  return (
    <div className="hands" aria-hidden="true">
      <Quiet>
        <HandsScene />
      </Quiet>
    </div>
  );
}
