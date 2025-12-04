import React, { useCallback, useRef, useState } from 'react';

const SWIPE_MIN_DISTANCE = 40; // px: 必要なドラッグ距離を少し短く
const START_EDGE_RATIO = 0.4; // 右端40%以内から開始（判定を広げる）

const PocariStickerLogo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0); // 0〜1: めくれ進捗
  const [isPeeling, setIsPeeling] = useState(false);
  const [isFallen, setIsFallen] = useState(false);

  const dragState = useRef<{
    active: boolean;
    startX: number;
    lastX: number;
    containerWidth: number;
  } | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setIsPeeling(false);
    setIsFallen(false);
    dragState.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isFallen) return; // 一度落ちたらリセット前は反応しない

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const fromRight = rect.width - x;

      // 右端から開始したときのみ有効（スマホでも広めに判定）
      if (fromRight / rect.width >= START_EDGE_RATIO) {
        dragState.current = {
          active: true,
          startX: x,
          lastX: x,
          containerWidth: rect.width,
        };
        setIsPeeling(true);
        containerRef.current?.setPointerCapture(e.pointerId);
      }
    },
    [isFallen]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !dragState.current.active) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const delta = dragState.current.startX - x; // 右→左で正になる

    if (delta <= 0) {
      setProgress(0);
      return;
    }

    const ratio = Math.min(1, delta / Math.max(SWIPE_MIN_DISTANCE, dragState.current.containerWidth * 0.6));
    setProgress(ratio);
    dragState.current.lastX = x;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !dragState.current.active) return;

    const totalDelta = dragState.current.startX - dragState.current.lastX;

    if (totalDelta > SWIPE_MIN_DISTANCE) {
      // 十分右→左に動かしたら、残りをアニメーションでめくり切りつつ下に落とす
      setProgress(1);
      setIsFallen(true);
    } else {
      // 足りなければ元に戻す
      setProgress(0);
      setIsPeeling(false);
    }

    dragState.current = null;
    containerRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  const peelRotation = -progress * 75; // 右端を支点に手前にめくれる
  const peelTranslateX = -progress * 10; // 少しだけ左に

  return (
    <div
      className="pocari-logo-wrapper"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 下地ロゴ */}
      <img src="/pocari_logo.svg" alt="Pocari Logo" className="pocari-logo-base" />

      {/* めくれるレイヤー（ドラッグ中〜めくり切るまで） */}
      {!isFallen && (
        <img
          src="/pocari_logo.svg"
          alt="Pocari Logo Sticker"
          className={`pocari-logo-sticker-image ${isPeeling ? 'is-peeling' : ''}`}
          style={{
            '--peel-rotation': `${peelRotation}deg`,
            '--peel-translate-x': `${peelTranslateX}px`,
          } as React.CSSProperties}
          draggable={false}
        />
      )}

      {/* 落下アニメーション用レイヤー */}
      {isFallen && (
        <img
          src="/pocari_logo.svg"
          alt="Pocari Logo Fallen"
          className="pocari-logo-sticker-fall-image"
          onAnimationEnd={reset}
          draggable={false}
        />
      )}
    </div>
  );
};

export default PocariStickerLogo;
