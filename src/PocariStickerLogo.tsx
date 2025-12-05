import React, { useEffect, useRef, useState } from 'react';

const PocariStickerLogo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPeeledOff, setIsPeeledOff] = useState(false);
  
  // ドラッグ状態
  const isDraggingRef = useRef(false);
  const anchorPointRef = useRef({ x: 0, y: 0 });
  const dragPointRef = useRef({ x: 0, y: 0 });

  // 画像をプリロード
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = '/pocari_logo.svg';
  }, []);

  // 描画ループ
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current || isPeeledOff) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // キャンバスサイズを画像に合わせる
    const maxWidth = Math.min(584, window.innerWidth * 0.8);
    const scale = maxWidth / img.width;
    const width = img.width * scale;
    const height = img.height * scale;
    
    canvas.width = width;
    canvas.height = height;

    // 初期位置設定
    anchorPointRef.current = { x: width, y: height / 2 };
    dragPointRef.current = { x: width, y: height / 2 };

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // ドラッグしていない時は元の位置に戻る（完全にはがれていない場合のみ）
      if (!isDraggingRef.current) {
        const ease = 0.2;
        const diffX = anchorPointRef.current.x - dragPointRef.current.x;
        const diffY = anchorPointRef.current.y - dragPointRef.current.y;
        
        if (Math.abs(diffX) > 0.5 || Math.abs(diffY) > 0.5) {
          dragPointRef.current.x += diffX * ease;
          dragPointRef.current.y += diffY * ease;
        } else {
          dragPointRef.current.x = anchorPointRef.current.x;
          dragPointRef.current.y = anchorPointRef.current.y;
        }
      }

      const midX = (dragPointRef.current.x + anchorPointRef.current.x) / 2;
      const midY = (dragPointRef.current.y + anchorPointRef.current.y) / 2;

      const dx = anchorPointRef.current.x - dragPointRef.current.x;
      const dy = anchorPointRef.current.y - dragPointRef.current.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // 完全にはがれたかチェック（左端まで引っ張られた）
      if (dragPointRef.current.x < width * 0.1) {
        setIsPeeledOff(true);
        return;
      }

      // 平らな状態
      if (dist < 1) {
        drawFullSticker();
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      const foldX = midX;
      const foldY = midY;

      // 表面（貼り付いている部分）
      ctx.save();
      ctx.beginPath();
      ctx.translate(foldX, foldY);
      ctx.rotate(angle - Math.PI / 2);
      ctx.rect(-width * 2, -height * 4, width * 4, height * 4);
      ctx.rotate(-(angle - Math.PI / 2));
      ctx.translate(-foldX, -foldY);
      ctx.clip();
      drawContent();
      ctx.restore();

      // 裏面（めくれた部分）
      ctx.save();
      ctx.translate(foldX, foldY);
      ctx.rotate(angle);
      ctx.scale(-1, 1);
      ctx.rotate(-angle);
      ctx.translate(-foldX, -foldY);

      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;

      ctx.beginPath();
      ctx.translate(foldX, foldY);
      ctx.rotate(angle - Math.PI / 2);
      ctx.rect(-width * 2, 0, width * 4, height * 4);
      ctx.rotate(-(angle - Math.PI / 2));
      ctx.translate(-foldX, -foldY);
      ctx.clip();

      // 裏面は白/グレー
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(0, 0, width, height);

      // 折り目の陰影
      const grad = ctx.createLinearGradient(foldX, foldY, foldX + dx * 0.4, foldY + dy * 0.4);
      grad.addColorStop(0, 'rgba(0,0,0,0.15)');
      grad.addColorStop(1, 'rgba(255,255,255,0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();

      // ヒント表示
      if (!isDraggingRef.current && dist < 2) {
        drawHint();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const drawContent = () => {
      ctx.drawImage(img, 0, 0, width, height);
    };

    const drawFullSticker = () => {
      drawContent();
      drawHint();
    };

    const drawHint = () => {
      const grad = ctx.createLinearGradient(width - 40, 0, width, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = grad;
      ctx.fillRect(width - 50, 0, 50, height);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [imageLoaded, isPeeledOff]);

  // ビデオのマスク設定
  useEffect(() => {
    if (!isPeeledOff || !imageRef.current || !videoContainerRef.current) return;

    const img = imageRef.current;
    const maxWidth = Math.min(584, window.innerWidth * 0.8);
    const scale = maxWidth / img.width;
    const width = img.width * scale;
    const height = img.height * scale;

    videoContainerRef.current.style.width = `${width}px`;
    videoContainerRef.current.style.height = `${height}px`;
  }, [isPeeledOff]);

  // イベントハンドラー
  const getPos = (e: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrag = (e: MouseEvent | TouchEvent) => {
    if (isPeeledOff) return;
    const pos = getPos(e);
    if (!pos || !canvasRef.current) return;

    const width = canvasRef.current.width;
    
    if (pos.x > width - 60) {
      isDraggingRef.current = true;
      anchorPointRef.current = { x: width, y: pos.y };
      dragPointRef.current = { x: width, y: pos.y };
    }
  };

  const moveDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || isPeeledOff) return;
    e.preventDefault();
    
    const pos = getPos(e);
    if (!pos || !canvasRef.current) return;

    const width = canvasRef.current.width;
    const dx = Math.min(pos.x, width);
    
    dragPointRef.current = { x: dx, y: pos.y };
  };

  const endDrag = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', startDrag as any);
    window.addEventListener('mousemove', moveDrag as any);
    window.addEventListener('mouseup', endDrag);

    canvas.addEventListener('touchstart', startDrag as any, { passive: false });
    window.addEventListener('touchmove', moveDrag as any, { passive: false });
    window.addEventListener('touchend', endDrag);

    return () => {
      canvas.removeEventListener('mousedown', startDrag as any);
      window.removeEventListener('mousemove', moveDrag as any);
      window.removeEventListener('mouseup', endDrag);

      canvas.removeEventListener('touchstart', startDrag as any);
      window.removeEventListener('touchmove', moveDrag as any);
      window.removeEventListener('touchend', endDrag);
    };
  }, [imageLoaded, isPeeledOff]);

  return (
    <div className="pocari-logo-wrapper">
      {isPeeledOff ? (
        <div ref={videoContainerRef} className="pocari-video-container">
          <iframe
            className="pocari-video-iframe"
            src="https://www.youtube.com/embed/nLLPBRPcF4w?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <img 
            src="/pocari_logo.svg" 
            alt="Pocari Logo Mask" 
            className="pocari-video-mask"
          />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="pocari-logo-canvas"
          style={{ cursor: 'grab' }}
        />
      )}
    </div>
  );
};

export default PocariStickerLogo;
