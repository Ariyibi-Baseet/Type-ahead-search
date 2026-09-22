import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlaceTypeahead from "../components/PlaceTypehead";

function mockPlace(
  name: string,
  id: number,
  country = "Nigeria",
  admin1 = "Lagos",
) {
  return {
    id,
    name,
    country,
    admin1,
    latitude: 6.5244,
    longitude: 3.3792,
    population: 1000000,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("PlaceTypeahead", () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("does not call the API until 300ms after the user stops typing", async () => {
    const user = userEvent.setup({ delay: null });
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({ results: [mockPlace("Lagos", 1)] }),
    );

    render(<PlaceTypeahead />);
    const input = screen.getByRole("combobox");

    await user.type(input, "la");
    expect(global.fetch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    expect(global.fetch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("shows a loading state while the request is in flight, then the results", async () => {
    const user = userEvent.setup({ delay: null });
    let resolveFetch: (v: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => (resolveFetch = resolve)),
    );

    render(<PlaceTypeahead />);
    await user.type(screen.getByRole("combobox"), "lag");
    jest.advanceTimersByTime(300);

    expect(await screen.findByText(/searching/i)).toBeInTheDocument();

    resolveFetch(await jsonResponse({ results: [mockPlace("Lagos", 1)] }));
    expect(await screen.findByText("Lagos")).toBeInTheDocument();
  });

  it("shows an empty state when the API returns no results", async () => {
    const user = userEvent.setup({ delay: null });
    // Open-Meteo signals "no matches" by omitting the `results` key.
    (global.fetch as jest.Mock).mockImplementation(() => jsonResponse({}));

    render(<PlaceTypeahead />);
    await user.type(screen.getByRole("combobox"), "zzzz");
    jest.advanceTimersByTime(300);

    expect(await screen.findByText(/no places match/i)).toBeInTheDocument();
  });

  it("shows an error state when the API fails", async () => {
    const user = userEvent.setup({ delay: null });
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse(
        { error: true, reason: "Parameter count must be between 1 and 100." },
        400,
      ),
    );

    render(<PlaceTypeahead />);
    await user.type(screen.getByRole("combobox"), "par");
    jest.advanceTimersByTime(300);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /parameter count/i,
    );
  });

  it("ignores stale out-of-order responses and keeps only the latest query's results", async () => {
    const user = userEvent.setup({ delay: null });

    const calls: Array<{ url: string; resolve: (v: unknown) => void }> = [];
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      return new Promise((resolve) => {
        calls.push({ url, resolve: (body) => resolve(body) });
      });
    });

    render(<PlaceTypeahead />);
    const input = screen.getByRole("combobox");

    await user.type(input, "pa");
    jest.advanceTimersByTime(300);
    await waitFor(() => expect(calls.length).toBe(1));

    await user.type(input, "r"); // query is now "par"
    jest.advanceTimersByTime(300);
    await waitFor(() => expect(calls.length).toBe(2));

    calls[1].resolve(
      await jsonResponse({
        results: [mockPlace("Paris", 2, "France", "Île-de-France")],
      }),
    );
    await screen.findByText("Paris");

    calls[0].resolve(
      await jsonResponse({
        results: [mockPlace("Palermo", 3, "Italy", "Sicily")],
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.queryByText("Palermo")).not.toBeInTheDocument();
    });
  });

  it("supports arrow-key navigation and Enter to select", async () => {
    const user = userEvent.setup({ delay: null });
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({
        results: [
          mockPlace("Lagos", 1, "Nigeria"),
          mockPlace("Lahore", 2, "Pakistan"),
        ],
      }),
    );

    render(<PlaceTypeahead />);
    const input = screen.getByRole("combobox");

    await user.type(input, "la");
    jest.advanceTimersByTime(300);
    await screen.findByText("Lagos");

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("Lahore");
    expect(await screen.findByText(/Pakistan/i)).toBeInTheDocument();
  });
});
