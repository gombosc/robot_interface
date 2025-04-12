"use client";

import { useState, useEffect } from "react";
import styles from "./Home.module.css";

interface RobotState {
  x: number;
  y: number;
}

type ButtonKey = "forward" | "backward" | "left" | "right";

export default function Home() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [robotState, setRobotState] = useState<RobotState>({ x: 0, y: 0 });
  const [pressedButtons, setPressedButtons] = useState<Record<ButtonKey, boolean>>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Arena and robot dimensions
  const containerWidth = 300;
  const containerHeight = 300;
  const robotWidth = 50;
  const robotHeight = 50;
  const scale = 20;
  const startLeft = (containerWidth - robotWidth) / 2;
  const startTop = (containerHeight - robotHeight) / 2;

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "state") {
        setRobotState(message.data);
      }
    };

    setWs(socket);
    return () => {
      socket.close();
    };
  }, []);

  const sendCommand = (command: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "command", data: command }));
    }
  };

  const triggerPressAnimation = (key: ButtonKey) => {
    setPressedButtons((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setPressedButtons((prev) => ({ ...prev, [key]: false }));
    }, 100);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      event.preventDefault();
      const key = event.key.toLowerCase();
      switch (key) {
        case "arrowup":
        case "w":
          sendCommand("forward");
          triggerPressAnimation("forward");
          break;
        case "arrowdown":
        case "s":
          sendCommand("backward");
          triggerPressAnimation("backward");
          break;
        case "arrowleft":
        case "a":
          sendCommand("left");
          triggerPressAnimation("left");
          break;
        case "arrowright":
        case "d":
          sendCommand("right");
          triggerPressAnimation("right");
          break;
        case "r":
          sendCommand("reset");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [ws]);

  return (
    <main className={styles.mainContainer}>
      <div className={styles.matrixContainer}>
        <h1 className={styles.matrixText} data-text="Virtual Robot Control">
          Virtual Robot Control
        </h1>
        <div className={styles.rain}></div>
      </div>
      <div className={styles.layout}>
        <div className={styles.controlPanel}>
          <div className={styles.dpad}>
            <div className={styles.dpadGrid}>
              <div></div>
              <button
                className={`${styles.arrowButton} ${pressedButtons.forward ? styles.pressed : ""}`}
                onClick={() => {
                  sendCommand("forward");
                  triggerPressAnimation("forward");
                }}
              >
                ↑
              </button>
              <div></div>
              <button
                className={`${styles.arrowButton} ${pressedButtons.left ? styles.pressed : ""}`}
                onClick={() => {
                  sendCommand("left");
                  triggerPressAnimation("left");
                }}
              >
                ←
              </button>
              <div></div>
              <button
                className={`${styles.arrowButton} ${pressedButtons.right ? styles.pressed : ""}`}
                onClick={() => {
                  sendCommand("right");
                  triggerPressAnimation("right");
                }}
              >
                →
              </button>
              <div></div>
              <button
                className={`${styles.arrowButton} ${pressedButtons.backward ? styles.pressed : ""}`}
                onClick={() => {
                  sendCommand("backward");
                  triggerPressAnimation("backward");
                }}
              >
                ↓
              </button>
              <div></div>
            </div>
          </div>
          <button className={styles.resetButton} onClick={() => sendCommand("reset")}>
            Reset
          </button>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.robotContainer}>
          <div className={styles.arena}>
            <div
              className={styles.robot}
              style={{
                left: `${startLeft + robotState.x * scale}px`,
                top: `${startTop + robotState.y * scale}px`,
              }}
            />
          </div>
          <div className={styles.stateInfo}>
            <p>
              X: {robotState.x}, Y: {robotState.y}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
