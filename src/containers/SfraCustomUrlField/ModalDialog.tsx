import React from "react";
import { Button, ButtonGroup, ModalBody, ModalFooter, ModalHeader } from "@contentstack/venus-components";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import "./ModalDialog.css";
import { pid } from "process";
import { ModalProps } from "@contentstack/venus-components/build/components/Modal/Modal";

interface ModalComponentProps extends ModalProps {
  pid: string;
  closeModal: () => void;
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
      <ModalHeader title="Product JSON" closeIconTestId="cs-default-header-close" closeModal={props.closeModal} />

      <ModalBody className="modalBodyCustomClass">{data ? <JsonView data={data || {}} /> : <>Loading...</>}</ModalBody>

      <ModalFooter>
        <ButtonGroup>
          <Button
            onClick={() => {
              props.closeModal();
            }}>
            Close
          </Button>
        </ButtonGroup>
      </ModalFooter>
    </>
  );
};

export default ModalComponent;
