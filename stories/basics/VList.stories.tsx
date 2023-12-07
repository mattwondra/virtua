import { Meta, StoryObj } from "@storybook/react";
import React, {
  CSSProperties,
  ReactElement,
  RefObject,
  createContext,
  forwardRef,
  startTransition,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  VList,
  VListHandle,
  CustomItemComponentProps,
  CustomViewportComponentProps,
  CacheSnapshot,
  ScrollToIndexAlign,
} from "../../src";
import { Spinner, delay } from "../common";

export default {
  component: VList,
} as Meta;

const createRows = (num: number) => {
  const heights = [20, 40, 80, 77];
  return Array.from({ length: num }).map((_, i) => {
    return (
      <div
        key={i}
        style={{
          height: heights[i % 4],
          borderBottom: "solid 1px #ccc",
          background: "#fff",
        }}
      >
        {i}
      </div>
    );
  });
};

export const Default: StoryObj = {
  render: () => {
    return <VList style={{ height: "100vh" }}>{createRows(1000)}</VList>;
  },
};

const createColumns = (num: number) => {
  return Array.from({ length: num }).map((_, i) => {
    return (
      <div
        key={i}
        style={{
          width: i % 3 === 0 ? 100 : 60,
          borderRight: "solid 1px #ccc",
          background: "#fff",
        }}
      >
        Column {i}
      </div>
    );
  });
};

export const Horizontal: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: 10 }}>
        <VList style={{ width: "100%", height: 200 }} horizontal>
          {createColumns(1000)}
        </VList>
      </div>
    );
  },
};

export const PaddingAndMargin: StoryObj = {
  render: () => {
    return (
      <VList
        style={{
          width: 400,
          height: 400,
          padding: "80px 20px",
          background: "lightgray",
        }}
      >
        {Array.from({ length: 1000 }).map((_, i) => {
          return (
            <div
              key={i}
              style={{
                height: 100,
                borderRadius: 8,
                margin: 10,
                padding: 10,
                background: "white",
              }}
            >
              {i}
            </div>
          );
        })}
      </VList>
    );
  },
};

export const Reverse: StoryObj = {
  render: () => {
    const ref = useRef<VListHandle>(null);
    useEffect(() => {
      ref.current?.scrollToIndex(999);
    }, []);
    return (
      <VList ref={ref} style={{ height: "100vh" }} reverse>
        {createRows(1000)}
      </VList>
    );
  },
};

export const Responsive: StoryObj = {
  render: () => {
    const itemClass = "item";
    return (
      <>
        <VList style={{ height: "100vh" }}>
          {Array.from({ length: 1000 }).map((_, i) => {
            return (
              <div
                key={i}
                className={itemClass}
                style={{
                  borderBottom: "solid 1px #ccc",
                  background: "#fff",
                }}
              >
                {i}
              </div>
            );
          })}
        </VList>
        <style>{`
          .${itemClass} {
            height: 40px;

            @media (max-width: 1024px) {
              height: 80px;
            }
            @media (max-width: 700px) {
              height: 160px;
            }
            @media (max-width: 400px) {
              height: 320px;
            }
          }
        `}</style>
      </>
    );
  },
};

// We'll represent virtualized items with an object, so we can inspect them to see where the sticky headers go
type RenderableItem = { type: 'header' | 'row', value: string };

// Since CacheSnapshot is opaque, we need to re-create the type here. In production the keys are obfuscated, so
// `_offsets` becomes something like `h`. Ideally, cache data would not be obscured, so we could reliably use it.
type Cache = {
  _offsets: number[],
};

// Our custom Root element will need the list of items, and the VList ref, to construct the sticky headers and
// render them. We'll use a context to pass these down to the Root element.
const StickyHeaderContext = createContext<{items: RenderableItem[], vListRef?: RefObject<VListHandle>}>({ items: [] })

// This component finds all the 'header' items and creates sticky scrolling headers for each. It uses the cache
// from vListRef to determine the offset of each placeholder header row, creating an absolutely-positioned <div>
// that stretches until the next `header`.
const StickyHeaders = () => {
  const { vListRef, items } = React.useContext(StickyHeaderContext)

  if ( ! vListRef?.current?.cache ) {
    return null;
  }
  const { _offsets } = vListRef.current.cache as unknown as Cache;

  // We'll work through the array backwards, so we can determine sticky heights based on the `top` for the header
  // below. On the first pass, the very bottom header should stretch to the bottom of the scrollable area.
  let prevTop = vListRef.current.scrollSize;
  return [...items].reverse().map((item, index) => {
    if (item.type !== 'header') return null;

    const top = _offsets[items.length - 1 - index];
    const height = prevTop - top;
    prevTop = top;

    return (
      /* The outer div creates the space within which the sticky header will scroll */
      <div key={item.value} style={{ top, height, width: '100%', position: 'absolute' }}>
        {/* The inner div is the scrolling sticky header itself */}
        <div style={{
          visibility: 'visible', // Needed for items inside virtua to be shown
          position: 'sticky',
          zIndex: 1,
          top: 0,
          background: '#fff',
          borderBottom: 'solid 1px #ccc',
          boxShadow: '0 -1px 0 #ccc',
          height: 30,
        }}>
          {item.value}
        </div>
      </div>
    );
  });
}

// Our custom Root element is identical to the default Viewport, except it renders <StickyHeaders /> as
// a sibling of the virtualized items. This means that _all_ headers will always be rendered — which is
// important because even if the placeholder for a `header` is outside the virtualized range, we still
// need the sticky header to be rendered so the user sees it.
export const ViewportWithStickyHeaders = forwardRef<any, CustomViewportComponentProps>(
  ({ children, attrs, width, height, scrolling }, ref): ReactElement => {
    return (
      <div ref={ref} {...attrs}>
        <div
          style={useMemo((): CSSProperties => {
            return {
              position: "relative",
              visibility: "hidden",
              width: width ?? "100%",
              height: height ?? "100%",
              pointerEvents: scrolling ? "none" : "auto",
            };
          }, [width, height, scrolling])}
        >
          <StickyHeaders />
          {children}
        </div>
      </div>
    );
  }
);

export const Sticky: StoryObj = {
  render: () => {
    const vListRef = useRef<VListHandle>(null);

    const items: RenderableItem[] = Array.from({ length: 1000 }).map((_, i) => {
      const tens = Math.floor(i / 10);
      const ones = i - (tens * 10);
      return ones === 0
        ? { type: 'header', value: `${tens}` }
        : { type: 'row', value: `${tens} - ${ones}` };
    });

    return (
      <StickyHeaderContext.Provider value={{ items, vListRef }}>
        <VList style={{ height: "100vh" }} ref={vListRef} components={{ Root: ViewportWithStickyHeaders }} count={items.length} overscan={4}>
          {i => {
            const item = items[i];
            if ( item.type === 'header' ) {
              // Placeholder for the sticky header, which will be rendered outside the virtualized list
              return <div style={{height: 31, background: '#fff'}} />;
            }
            return <div style={{height: 60, background: '#fff'}}>{item.value}</div>;
          } }
        </VList>
      </StickyHeaderContext.Provider>
    );
  },
};

export const ScrollTo: StoryObj = {
  render: () => {
    const LENGTH = 1000;
    const [scrollIndex, setScrollIndex] = useState(567);
    const [scrollIndexAlign, setScrollToIndexAlign] =
      useState<ScrollToIndexAlign>("start");
    const [smooth, setSmooth] = useState(false);
    const [scrollOffset, setScrollOffset] = useState(1000);
    const ref = useRef<VListHandle>(null);
    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div>
          <input
            type="number"
            value={scrollIndex}
            onChange={(e) => {
              setScrollIndex(Number(e.target.value));
            }}
          />
          <button
            onClick={() => {
              ref.current?.scrollToIndex(scrollIndex, {
                align: scrollIndexAlign,
                smooth: smooth,
              });
            }}
          >
            scroll to index
          </button>
          <button
            onClick={() => {
              setScrollIndex(Math.round(LENGTH * Math.random()));
            }}
          >
            randomize
          </button>
          <label style={{ marginLeft: 4 }}>
            <input
              type="radio"
              style={{ marginLeft: 4 }}
              checked={scrollIndexAlign === "start"}
              onChange={() => {
                setScrollToIndexAlign("start");
              }}
            />
            start
          </label>
          <label style={{ marginLeft: 4 }}>
            <input
              type="radio"
              style={{ marginLeft: 4 }}
              checked={scrollIndexAlign === "center"}
              onChange={() => {
                setScrollToIndexAlign("center");
              }}
            />
            center
          </label>
          <label style={{ marginLeft: 4 }}>
            <input
              type="radio"
              style={{ marginLeft: 4 }}
              checked={scrollIndexAlign === "end"}
              onChange={() => {
                setScrollToIndexAlign("end");
              }}
            />
            end
          </label>

          <label style={{ marginLeft: 4 }}>
            <input
              type="checkbox"
              style={{ marginLeft: 4 }}
              checked={smooth}
              onChange={() => {
                setSmooth((prev) => !prev);
              }}
            />
            smooth
          </label>
        </div>
        <div>
          <div>
            <input
              type="number"
              value={scrollOffset}
              onChange={(e) => {
                setScrollOffset(Number(e.target.value));
              }}
            />
            <button
              onClick={() => {
                ref.current?.scrollTo(scrollOffset);
              }}
            >
              scroll to offset
            </button>
            <button
              onClick={() => {
                ref.current?.scrollBy(scrollOffset);
              }}
            >
              scroll by offset
            </button>
          </div>
        </div>
        <VList ref={ref} style={{ flex: 1 }}>
          {createRows(LENGTH)}
        </VList>
      </div>
    );
  },
};

export const RenderProp: StoryObj = {
  render: () => {
    const id = useRef(0);
    const heights = [20, 40, 80, 77];
    const createItem = () => {
      const i = id.current++;
      return {
        id: i,
        height: heights[i % 4],
      };
    };

    const [items, setItems] = useState(() => {
      return Array.from({ length: 1000 }).map(() => createItem());
    });

    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div>
          <button
            onClick={() => {
              setItems((prev) => [
                ...prev,
                ...Array.from({ length: 500 }).map(() => createItem()),
              ]);
            }}
          >
            append more
          </button>
        </div>
        <VList style={{ flex: 1 }} count={items.length}>
          {(i) => {
            const item = items[i];
            return (
              <div
                key={item.id}
                style={{
                  height: item.height,
                  borderBottom: "solid 1px #ccc",
                  background: "#fff",
                }}
              >
                {i}
              </div>
            );
          }}
        </VList>
      </div>
    );
  },
};

export const Keyboard: StoryObj = {
  render: () => {
    const ref = useRef<VListHandle>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const items = Array.from({ length: 1000 }).map((_, i) => {
      return (
        <div
          key={i}
          style={{
            height: 60,
            borderBottom: "solid 1px #ccc",
            background: selectedIndex === i ? "skyblue" : "white",
            cursor: "pointer",
          }}
          onClick={() => {
            setSelectedIndex(i);
          }}
        >
          {i}
        </div>
      );
    });

    return (
      <VList
        ref={ref}
        style={{ height: 400, width: 400, margin: 10 }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!ref.current) return;

          switch (e.code) {
            case "ArrowUp":
              e.preventDefault();
              const prevIndex = Math.max(selectedIndex - 1, 0);
              setSelectedIndex(prevIndex);
              ref.current.scrollToIndex(prevIndex, { align: "nearest" });
              break;
            case "ArrowDown":
              e.preventDefault();
              const nextIndex = Math.min(selectedIndex + 1, items.length - 1);
              setSelectedIndex(nextIndex);
              ref.current.scrollToIndex(nextIndex, { align: "nearest" });
              break;
          }
        }}
      >
        {items}
      </VList>
    );
  },
};

const RestorableList = ({ id }: { id: string }) => {
  const cacheKey = "list-cache-" + id;

  const ref = useRef<VListHandle>(null);

  const [offset, cache] = useMemo(() => {
    const serialized = sessionStorage.getItem(cacheKey);
    if (!serialized) return [];
    try {
      return JSON.parse(serialized) as [number, CacheSnapshot];
    } catch (e) {
      return [];
    }
  }, []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const handle = ref.current;

    if (offset) {
      handle.scrollTo(offset);
    }

    return () => {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify([handle.scrollOffset, handle.cache])
      );
    };
  }, []);

  return (
    <VList ref={ref} cache={cache} style={{ height: "100vh" }}>
      {createRows(1000)}
    </VList>
  );
};

export const ScrollRestoration: StoryObj = {
  render: () => {
    const [show, setShow] = useState(true);
    const [selectedId, setSelectedId] = useState("1");

    return (
      <div>
        <button
          onClick={() => {
            setShow((prev) => !prev);
          }}
        >
          {show ? "hide" : "show"}
        </button>
        {["1", "2", "3"].map((id) => (
          <label key={id}>
            <input
              type="radio"
              checked={selectedId === id}
              onChange={() => {
                setSelectedId(id);
              }}
            />
            {id}
          </label>
        ))}
        {show && <RestorableList key={selectedId} id={selectedId} />}
      </div>
    );
  },
};

export const InfiniteScrolling: StoryObj = {
  render: () => {
    const createRows = (num: number, offset: number = 0) => {
      const heights = [20, 40, 80, 77];
      return Array.from({ length: num }).map((_, i) => {
        i += offset;
        return (
          <div
            key={i}
            style={{
              height: heights[i % 4],
              borderBottom: "solid 1px #ccc",
              background: "#fff",
            }}
          >
            {i}
          </div>
        );
      });
    };

    const [fetching, setFetching] = useState(false);
    const fetchItems = async () => {
      setFetching(true);
      await delay(1000);
      setFetching(false);
    };

    const ITEM_BATCH_COUNT = 100;
    const [items, setItems] = useState(() => createRows(ITEM_BATCH_COUNT));
    const fetchedCountRef = useRef(-1);
    const count = items.length;

    return (
      <VList
        style={{ flex: 1 }}
        onRangeChange={async (_, end) => {
          if (end + 50 > count && fetchedCountRef.current < count) {
            fetchedCountRef.current = count;
            await fetchItems();
            setItems((prev) => [
              ...prev,
              ...createRows(ITEM_BATCH_COUNT, prev.length),
            ]);
          }
        }}
      >
        {items}
        {fetching && <Spinner />}
      </VList>
    );
  },
};

export const BiDirectionalInfiniteScrolling: StoryObj = {
  render: () => {
    const id = useRef(0);
    const createRows = (num: number) => {
      const heights = [20, 40, 80, 77];
      return Array.from({ length: num }).map(() => {
        const i = id.current++;
        return (
          <div
            key={i}
            style={{
              height: heights[i % 4],
              borderBottom: "solid 1px #ccc",
              background: "#fff",
            }}
          >
            {i}
          </div>
        );
      });
    };

    const [shifting, setShifting] = useState(false);
    const [startFetching, setStartFetching] = useState(false);
    const [endFetching, setEndFetching] = useState(false);
    const fetchItems = async (isStart: boolean = false) => {
      setShifting(isStart);

      const setFetching = isStart ? setStartFetching : setEndFetching;

      setFetching(true);
      await delay(1000);
      setFetching(false);
    };

    const ref = useRef<VListHandle>(null);
    const ITEM_BATCH_COUNT = 100;
    const [items, setItems] = useState(() => createRows(ITEM_BATCH_COUNT * 2));
    const THRESHOLD = 50;
    const count = items.length;
    const startFetchedCountRef = useRef(-1);
    const endFetchedCountRef = useRef(-1);

    const ready = useRef(false);
    useEffect(() => {
      ref.current?.scrollToIndex(items.length / 2 + 1);
      ready.current = true;
    }, []);

    return (
      <VList
        ref={ref}
        style={{ flex: 1 }}
        shift={shifting ? true : false}
        onRangeChange={async (start, end) => {
          if (!ready.current) return;
          if (end + THRESHOLD > count && endFetchedCountRef.current < count) {
            endFetchedCountRef.current = count;
            await fetchItems();
            setItems((prev) => [...prev, ...createRows(ITEM_BATCH_COUNT)]);
          } else if (
            start - THRESHOLD < 0 &&
            startFetchedCountRef.current < count
          ) {
            startFetchedCountRef.current = count;
            await fetchItems(true);
            setItems((prev) => [
              ...createRows(ITEM_BATCH_COUNT).reverse(),
              ...prev,
            ]);
          }
        }}
      >
        <Spinner
          key="head"
          style={startFetching ? undefined : { visibility: "hidden" }}
        />
        {items}
        <Spinner
          key="foot"
          style={endFetching ? undefined : { visibility: "hidden" }}
        />
      </VList>
    );
  },
};

export const Statuses: StoryObj = {
  render: () => {
    const ref = useRef<VListHandle>(null);
    const items = useState(() => createRows(1000))[0];
    const [position, setPosition] = useState(0);
    const [scrolling, setScrolling] = useState(false);
    const [range, setRange] = useState([-1, -1]);

    const [isAtTop, setIsAtTop] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);

    useEffect(() => {
      if (!ref.current) return;
      if (ref.current.scrollOffset === 0) {
        setIsAtTop(true);
      } else {
        setIsAtTop(false);
      }
      if (
        ref.current.scrollOffset -
          ref.current.scrollSize +
          ref.current.viewportSize >=
        // FIXME: The sum may not be 0 because of sub-pixel value when browser's window.devicePixelRatio has decimal value
        -1.5
      ) {
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
      }
    }, [position]);

    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            background: "white",
            borderBottom: "solid 1px #ccc",
          }}
        >
          <div>scrollTop: {position}</div>
          <div>scrolling: {scrolling ? "true" : "false"}</div>
          <div>
            index: ({range[0]}, {range[1]})
          </div>
          <div>at top: {isAtTop ? "true" : "false"}</div>
          <div>at bottom: {isAtBottom ? "true" : "false"}</div>
        </div>
        <VList
          ref={ref}
          style={{ flex: 1 }}
          onScroll={(offset) => {
            startTransition(() => {
              setPosition(offset);
              setScrolling(true);
            });
          }}
          onScrollStop={() => {
            startTransition(() => {
              setScrolling(false);
            });
          }}
          onRangeChange={async (start, end) => {
            startTransition(() => {
              setRange([start, end]);
            });
          }}
        >
          {items}
        </VList>
      </div>
    );
  },
};

export const WithState: StoryObj = {
  render: () => {
    const [actives, setActives] = useState<{ [key: number]: boolean }>({
      0: true,
      3: true,
      6: true,
      9: true,
      12: true,
    });
    return (
      <VList style={{ height: "100vh" }}>
        {Array.from({ length: 1000 }).map((_, i) => {
          const active = !!actives[i];
          return (
            <div
              key={i}
              style={{
                borderBottom: "solid 1px #ccc",
                background: active ? "lightpink" : "#fff",
                display: "flex",
                flexDirection: "row",
                transition: "0.5s ease",
              }}
            >
              <div>
                <button
                  style={{ height: "100%" }}
                  onClick={() => {
                    setActives((prev) => ({
                      ...prev,
                      [i]: !prev[i],
                    }));
                  }}
                >
                  {active ? "close" : "open"}
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                  height: active ? 200 : 40,
                  transition: "0.5s ease",
                }}
              >
                {i}
              </div>
            </div>
          );
        })}
      </VList>
    );
  },
};

export const IncreasingItems: StoryObj = {
  render: () => {
    const id = useRef(0);
    const createRows = (num: number, offset: number) => {
      return Array.from({ length: num }).map((_, i) => {
        i += offset;
        return { id: id.current++, index: i };
      });
    };

    const [auto, setAuto] = useState(false);
    const [amount, setAmount] = useState(4);
    const [prepend, setPrepend] = useState(false);
    const [increase, setIncrease] = useState(true);
    const [rows, setRows] = useState(() => createRows(amount, 0));
    const update = () => {
      if (increase) {
        setRows((prev) =>
          prepend
            ? [...createRows(amount, (prev[0]?.index ?? 0) - amount), ...prev]
            : [
                ...prev,
                ...createRows(amount, (prev[prev.length - 1]?.index ?? 0) + 1),
              ]
        );
      } else {
        if (prepend) {
          setRows((prev) => prev.slice(amount));
        } else {
          setRows((prev) => prev.slice(0, -amount));
        }
      }
    };
    useEffect(() => {
      if (!auto) return;
      const timer = setInterval(update, 500);
      return () => {
        clearInterval(timer);
      };
    }, [update, auto]);

    const heights = [20, 40, 80, 77];

    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div>
          <label style={{ marginRight: 4 }}>
            <input
              type="radio"
              style={{ marginLeft: 4 }}
              checked={!prepend}
              onChange={() => {
                setPrepend(false);
              }}
            />
            append
          </label>
          <label style={{ marginRight: 4 }}>
            <input
              type="radio"
              style={{ marginLeft: 4 }}
              checked={prepend}
              onChange={() => {
                setPrepend(true);
              }}
            />
            prepend
          </label>
          <label style={{ marginRight: 4 }}>
            <input
              type="radio"
              style={{ marginLeft: 4 }}
              checked={increase}
              onChange={() => {
                setIncrease(true);
              }}
            />
            increase
          </label>
          <label style={{ marginRight: 4 }}>
            <input
              type="radio"
              style={{ marginLeft: 4 }}
              checked={!increase}
              onChange={() => {
                setIncrease(false);
              }}
            />
            decrease
          </label>
          <input
            style={{ marginLeft: 4 }}
            value={amount}
            type="number"
            min={1}
            max={10000}
            step={1}
            onChange={(e) => {
              setAmount(Number(e.target.value));
            }}
          />
        </div>
        <div>
          <label style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              style={{ marginLeft: 4 }}
              checked={auto}
              onChange={() => {
                setAuto((prev) => !prev);
              }}
            />
            auto
          </label>
          <button
            onClick={() => {
              update();
            }}
          >
            update
          </button>
        </div>
        <VList style={{ flex: 1 }} shift={prepend ? true : false}>
          {rows.map((d) => (
            <div
              key={d.id}
              style={{
                height: heights[Math.abs(d.index) % 4],
                borderBottom: "solid 1px #ccc",
                background: "#fff",
              }}
            >
              {d.index}
            </div>
          ))}
        </VList>
      </div>
    );
  },
};

const UlList = forwardRef<HTMLDivElement, CustomViewportComponentProps>(
  ({ children, attrs, height }, ref) => {
    return (
      <div ref={ref} {...attrs}>
        <ul
          style={{
            position: "relative",
            height,
            margin: 0,
            overflow: "hidden",
          }}
        >
          {children}
        </ul>
      </div>
    );
  }
);
const Li = forwardRef<HTMLLIElement, CustomItemComponentProps>(
  ({ children, style }, ref) => {
    return (
      <li ref={ref} style={{ ...style, marginLeft: 30 }}>
        {children}
      </li>
    );
  }
);

export const Ul: StoryObj = {
  render: () => {
    return (
      <div
        style={{
          width: 400,
          height: 400,
          border: "solid 1px darkgray",
          borderRadius: 8,
          background: "lightgray",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 4 }}>header</div>
        <VList
          style={{
            flex: 1,
            background: "#fff",
          }}
          components={{ Root: UlList, Item: Li }}
          overscan={20}
        >
          {Array.from({ length: 1000 }).map((_, i) => i)}
        </VList>
      </div>
    );
  },
};
