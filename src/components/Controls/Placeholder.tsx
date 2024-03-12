export const Placeholder = () => {
  return (
    <div
      className="h-16 w-16"
      onGotPointerCapture={(event) => {
        const targetElement = event.target as HTMLDivElement;
        targetElement.releasePointerCapture(event.pointerId);
      }}
    ></div>
  );
};
