import React from "react";
import { Button, ButtonGroup, ModalBody, ModalFooter, ModalHeader } from "@contentstack/venus-components";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import "./ModalDialog.css";
import { pid } from "process";
import { ModalProps } from "@contentstack/venus-components/build/components/Modal/Modal";
import { useInstallationData } from "../../common/hooks/useInstallationData";

interface ModalComponentProps extends ModalProps {
  pid: string;
  jsonEndpoint: string;
  closeModal: () => void;
}
const ModalComponent = (props: ModalComponentProps) => {
  const [data, setData] = React.useState();
  React.useEffect(() => {
    if (!props.pid || !props.jsonEndpoint) return;

    const fetchProductData = async () => {
      const response = await fetch(props.jsonEndpoint + props.pid);
      const data = await response.json();
      setData(data);
    };
    fetchProductData();
  }, [props.jsonEndpoint, props.pid]);
  return (
    <>
      <ModalHeader title="Product JSON" closeIconTestId="cs-default-header-close" closeModal={props.closeModal} />

      <ModalBody className="modalBodyCustomClass">{data ? <JsonView data={data || {}} /> : <>Loading...</>}</ModalBody>

      <ModalFooter>
        <ButtonGroup>
          <Button
            onClick={() => {
              props.closeModal();
            }}
          >
            Close
          </Button>
        </ButtonGroup>
      </ModalFooter>
    </>
  );
};

export default ModalComponent;
