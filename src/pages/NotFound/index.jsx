import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const ease = 'ease-[cubic-bezier(0.16,1,0.3,1)]';

  return (
    <div className="min-h-dvh bg-gray-bg relative overflow-hidden">
      {/* Decorative 404 watermark — asymmetric bottom-right */}
      <div
        aria-hidden="true"
        className={[
          'absolute inset-0 flex items-end justify-end',
          'pointer-events-none select-none overflow-hidden',
          `transition-all duration-[1.4s] ${ease}`,
          mounted
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-16',
        ].join(' ')}
      >
        <span className="text-[32vw] font-bold tracking-tighter leading-none text-navy-900/3 -mb-[5vw] -mr-[2vw]">
          404
        </span>
      </div>

      {/* Geometric accent — circle */}
      <div
        aria-hidden="true"
        className={[
          'absolute top-[16%] right-[14%] w-36 h-36',
          'rounded-full border border-divider/50',
          `transition-all duration-[1.2s] delay-400 ${ease}`,
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50',
        ].join(' ')}
      />

      {/* Geometric accent — rotated square */}
      <div
        aria-hidden="true"
        className={[
          'absolute bottom-[22%] left-[7%] w-14 h-14',
          'rounded-2xl bg-brand/5 rotate-45',
          `transition-all duration-[1.2s] delay-600 ${ease}`,
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50',
        ].join(' ')}
      />

      {/* Geometric accent — dot */}
      <div
        aria-hidden="true"
        className={[
          'absolute top-[52%] right-[38%] w-1.5 h-1.5',
          'rounded-full bg-brand/20',
          'transition-all duration-1000 delay-700',
          mounted ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />

      {/* Left-aligned content block */}
      <div className="relative z-10 min-h-dvh flex items-center px-6 md:px-16 lg:px-24 xl:pl-[14vw]">
        <div
          className={[
            'max-w-md',
            `transition-all duration-700 delay-150 ${ease}`,
            mounted
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10',
          ].join(' ')}
        >
          {/* Accent label */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-px bg-text-tertiary/40" />
            <Compass
              className="w-4 h-4 text-text-tertiary"
              strokeWidth={1.5}
            />
            <span className="text-xs text-text-tertiary tracking-[0.2em] uppercase font-medium">
              Not Found
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-navy-900 leading-[1.08]">
            此页面
            <br />
            <span className="text-brand">不存在</span>
          </h1>

          <p className="mt-5 text-base text-text-secondary leading-relaxed max-w-[46ch]">
            你访问的页面可能已被移除、名称已更改，或暂时无法访问。请检查链接是否正确。
          </p>

          <Link
            to="/"
            className={[
              'group mt-10 inline-flex items-center gap-2.5',
              'px-7 py-3.5 bg-navy-900 text-white text-sm font-medium rounded-xl',
              'hover:bg-navy-900/90 active:scale-[0.98] active:-translate-y-px',
              'transition-all duration-200',
              'shadow-[0_2px_8px_-2px_rgba(25,32,51,0.25)]',
            ].join(' ')}
          >
            <ArrowLeft
              className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"
              strokeWidth={1.5}
            />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
