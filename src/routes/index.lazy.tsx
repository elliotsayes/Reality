import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  // Form to enter verse ID
  return (
    <div className="flex justify-center items-center h-dvh">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-screen-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.target[0] as HTMLInputElement;
            const verseId = input.value;
            navigate({
              to: "/$",
              params: {
                _splat: verseId,
              },
            });
          }}
        >
          <input
            type="text"
            placeholder="Enter world ID"
            className="border border-gray-300 rounded-lg p-2"
          />
          <button className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
