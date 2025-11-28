// apps/consumer-web/app/my-videos/page.tsx
const myVideos = [
  { id: 'vid_1', thumb: '', status: 'validated' },
  { id: 'vid_2', thumb: '', status: 'processing' },
  { id: 'vid_3', thumb: '', status: 'rejected' },
  { id: 'vid_4', thumb: '', status: 'validated' },
];

export default function MyVideosPage() {
  return (
    <div className="pb-6">
      {/* profile header */}
      <section className="flex items-center gap-4 px-4 py-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-lg font-semibold">
          MM
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">@milk_mob_user</span>
          <div className="flex gap-6 text-xs text-slate-300">
            <div className="flex flex-col items-center">
              <span className="font-semibold">4</span>
              <span>Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold">128</span>
              <span>Mobs joined</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold">512</span>
              <span>Views</span>
            </div>
          </div>
        </div>
      </section>

      {/* tabs */}
      <div className="flex border-t border-b border-slate-900 text-xs text-slate-400">
        <button className="flex-1 py-2 text-center border-b-2 border-slate-50 font-semibold text-slate-50">
          Posts
        </button>
        <button className="flex-1 py-2 text-center">
          Saved
        </button>
      </div>

      {/* grid of posts */}
      <section className="grid grid-cols-3 gap-[1px] bg-slate-900">
        {myVideos.map((v) => (
          <div
            key={v.id}
            className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 aspect-square"
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">
              Video
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
