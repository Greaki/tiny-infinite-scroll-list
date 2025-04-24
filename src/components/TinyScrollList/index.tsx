import { TouchEvent, useEffect, useRef, useState } from 'react';
import './index.css';
import { useDebounceFn } from 'ahooks';

interface IDataType {
  key: string;
}

const InfiniteScrollList = ({
  data = [],
  itemHeight = 30,
  visibleCount = 20,
  speed = 0.5,
  topBuffer = 0,
  bottomBuffer = 0,
  renderItem,
  onTouchStart,
  onTouchEnd,
  autoPlay = false,
  canScroll = true,
}: Record<string, any>) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const offsetY = useRef(0);
  const isPaused = useRef(false);
  const animationFrame = useRef<number>();
  const startY = useRef(0);
  const lastY = useRef(0);
  const timer = useRef(0);

  const offMoveEvent = useDebounceFn(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      isPaused.current = false;
      onTouchEnd?.()
    }, 500)
  }, {
    wait: 2000
  })

  const [visibleItems, setVisibleItems] = useState<IDataType[]>(() => {
    return data.slice(0, visibleCount + bottomBuffer);
  });

  const startIndex = useRef(0); // 从 0 开始

  const setTransform = () => {
    if (listRef.current) {
      listRef.current.style.transform = `translateY(-${offsetY.current}px)`;
    }
  };

  /**
   * refreshRate这里更准确的表达是一种刷新率,只能为整数
   * 1 表示每上去一个元素，就刷新
   * 2 表示每上去两个元素，就刷新
   * 3 表示每上去三个元素，就刷新
   * 理论上越大越好，因为数值刷大，他闪一下的时候间隔更长，看起来更平滑
   */
  const shiftUp = (refreshRate = 1) => {
    const newStartIndex = (startIndex.current + refreshRate) % data.length;
    const newVisible: IDataType[] = [];
    for (let i = 0; i < visibleCount + bottomBuffer; i++) {
      if (newStartIndex >= 0) {
        newVisible.push(data[(newStartIndex + i) % data.length]);
      } else {
        newVisible.push(data[(data.length + newStartIndex + i) % data.length]);
      }
    }
    console.log('执行shiftUp', newStartIndex, newVisible);
    setVisibleItems(newVisible);
    startIndex.current = newStartIndex;
    offsetY.current -= itemHeight * refreshRate;
    setTransform();
  };

  const shiftDown = () => {
    const newStartIndex = (startIndex.current - 1) % data.length;
    const newVisible: IDataType[] = [];
    for (let i = 0; i < visibleCount + topBuffer; i++) {
      if (newStartIndex >= 0) {
        newVisible.push(data[(newStartIndex + i) % data.length]);
      } else {
        newVisible.push(data[(data.length + newStartIndex + i) % data.length]);
      }
    }
    console.log('执行shiftDown', newStartIndex, newVisible);
    setVisibleItems(newVisible);
    startIndex.current = newStartIndex;
    // debugger
    offsetY.current += itemHeight * 2; // why，cause this is math ,如果是一倍的话，视觉看起来就会没有往上滑动的效果，只是数据变了
    setTransform();
  };

  const scrollLoop = () => {
    if (!isPaused.current) {
      offsetY.current += speed;
      setTransform();
      const refreshRate = data.length < visibleCount * 2 ? data.length %  visibleCount : visibleCount; // 动态计算刷新率
      if (offsetY.current >= itemHeight * refreshRate) {
        shiftUp(refreshRate);
      }
    }
    animationFrame.current = requestAnimationFrame(scrollLoop);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!canScroll) return
    startY.current = e.touches[0].clientY;
    lastY.current = startY.current;
    isPaused.current = true;
    onTouchStart?.(e);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!canScroll) return
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - lastY.current;
    offsetY.current -= deltaY;
    setTransform();
    lastY.current = currentY;

    while (offsetY.current >= itemHeight) {
      shiftUp();
    }

    while (offsetY.current <= -itemHeight) {
      shiftDown();
    }

    offMoveEvent.run()
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!canScroll) return
    // isPaused.current = false;
    startY.current = 0;
    lastY.current = 0;

    onTouchEnd?.()
  };

  useEffect(() => {
    if (!data.length) return;

    autoPlay && scrollLoop();

    return () => {
      cancelAnimationFrame(animationFrame.current as number);
    };
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="scroll-container"
      style={{ height: itemHeight * visibleCount }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={listRef}
        className="scroll-list"
        style={{ transform: `translateY(-${offsetY.current}px)` }}
      >
        {/*{visibleItems?.length}*/}
        {visibleItems.map((item, index) => (
          <>
            {renderItem(item)}
          </>
        ))}
      </div>
    </div>
  );
};

export default InfiniteScrollList;
