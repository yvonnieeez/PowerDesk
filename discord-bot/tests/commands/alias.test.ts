describe("room alias mapping", () => {
  const ALIAS_MAP: Record<string, string> = {
    drawing: "drawing-room",
    "drawing room": "drawing-room",
    work1: "work-room-1",
    "work room 1": "work-room-1",
    work2: "work-room-2",
    "work room 2": "work-room-2",
  };

  function resolveRoom(input: string): string | null {
    const normalized = input.toLowerCase().trim();
    return ALIAS_MAP[normalized] ?? null;
  }

  it("resolves 'drawing' to drawing-room", () => {
    expect(resolveRoom("drawing")).toBe("drawing-room");
  });

  it("resolves 'drawing room' to drawing-room", () => {
    expect(resolveRoom("drawing room")).toBe("drawing-room");
  });

  it("resolves 'work1' to work-room-1", () => {
    expect(resolveRoom("work1")).toBe("work-room-1");
  });

  it("resolves 'work room 1' to work-room-1", () => {
    expect(resolveRoom("work room 1")).toBe("work-room-1");
  });

  it("resolves 'work2' to work-room-2", () => {
    expect(resolveRoom("work2")).toBe("work-room-2");
  });

  it("resolves 'work room 2' to work-room-2", () => {
    expect(resolveRoom("work room 2")).toBe("work-room-2");
  });

  it("returns null for unknown room", () => {
    expect(resolveRoom("nonsense")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(resolveRoom("")).toBeNull();
  });

  it("is case insensitive", () => {
    expect(resolveRoom("WORK1")).toBe("work-room-1");
    expect(resolveRoom("Drawing")).toBe("drawing-room");
  });
});
