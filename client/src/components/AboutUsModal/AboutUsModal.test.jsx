// AboutUsModal.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AboutUsModal from "./AboutUsModal";

describe("AboutUsModal", () => {
  it("renders when open and displays logo and text", () => {
    render(<AboutUsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/About GetSpace/i)).toBeInTheDocument();
    expect(screen.getByText(/Premium locations/i)).toBeInTheDocument();
    expect(screen.getByText(/Easy online booking/i)).toBeInTheDocument();
    expect(screen.getByText(/Customizable amenities/i)).toBeInTheDocument();
    expect(screen.getByText(/GetSpace. All rights reserved./i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = render(<AboutUsModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = jest.fn();
    render(<AboutUsModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/Close/i));
    expect(onClose).toHaveBeenCalled();
  });
});
