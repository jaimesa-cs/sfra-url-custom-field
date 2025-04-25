import React from "react";
import { Button, ButtonGroup, ModalBody, ModalFooter, ModalHeader } from "@contentstack/venus-components";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import "./ModalDialog.css";
import { pid } from "process";

interface ModalComponentProps {
  closeModal: () => void;
  pid: string;
}
const ModalComponent = (props: ModalComponentProps) => {
  const pid = props.pid;
  const [data, setData] = React.useState();
  React.useEffect(() => {
    const fetchProductData = async () => {
      const response = await fetch(
        "https://zybx-002.dx.commercecloud.salesforce.com/on/demandware.store/Sites-neemo-Site/default/Product-JSON?pid=" +
          pid
      );

      const data = await response.json();
      setData(data);
    };
    fetchProductData();
  }, []);
  return (
    <>
      <ModalHeader title="Product JSON" closeModal={props.closeModal} closeIconTestId="cs-default-header-close" />

      <ModalBody className="modalBodyCustomClass">{data ? <JsonView data={data || {}} /> : <>Loading...</>}</ModalBody>

      <ModalFooter>
        <ButtonGroup>
          <Button buttonType="light" onClick={() => props.closeModal()}>
            Cancel
          </Button>
          <Button>Send</Button>
        </ButtonGroup>
      </ModalFooter>
    </>
  );
};

export default ModalComponent;
