import { useRef } from "react";
import useFetch from "./hooks/useFetch";

type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

function App() {
  const offset = useRef(0);

  const { data, isLoading, error, refetch } = useFetch<Todo[]>({
    url:
      "https://jsonplaceholder.typicode.com/todos?_limit=10&_start=" +
      offset.current,
  });

  const handleTodoRefetch = () => {
    offset.current += 10 * Math.floor(Math.random() * 2);
    console.log(offset.current);
    refetch();
  };

  const {
    data: blob,
    isLoading: isImageLoading,
    error: imageError,
    refetch: refetchImage,
  } = useFetch<Blob>({
    url: "https://picsum.photos/200/300",
    responseType: "blob",
  });

  const imageUrl = blob ? URL.createObjectURL(blob) : null;

  return (
    <div className="flex">
      <div className="w-1/2">
        {isLoading && <div>JSON Loading...</div>}
        {error && <div>{error.message}</div>}
        {data && data.map((todo) => <div key={todo.id}>{todo.title}</div>)}
        <button className="border p-4" onClick={handleTodoRefetch}>
          Refetch
        </button>
      </div>
      <div className="w-1/2">
        {isImageLoading && <div>Image Loading...</div>}
        {imageError && <div>{imageError.message}</div>}
        {imageUrl && <img src={imageUrl} alt="Blob Image" />}
        <button className="border p-4" onClick={refetchImage}>
          Refetch
        </button>
      </div>
    </div>
  );
}

export default App;
