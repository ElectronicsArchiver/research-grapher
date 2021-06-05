import React, { Suspense, useEffect, useRef } from "react";
import { Col, ProgressBar, Row } from "react-materialize";
import { ForceGraph3D } from "react-force-graph";
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  LineBasicMaterial,
  BufferGeometry,
  BufferAttribute,
  Line,
} from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import SpriteText from "three-spritetext";

import circle_node from "./circle_node.svg";
import cone_node from "./cone_node.svg";
import { useSelector } from "react-redux";
import {
  attachLabelsToEdges,
  beautifyNodes,
  convertToD3Graph,
} from "./GraphOperations";
import store from "../store/store";
import { changeSelectedNode } from "../store/GraphSlice";

const Card = React.lazy(() => import("react-materialize/lib/Card"));

const CitationGraph = () => {
  let data;
  let graph = useSelector((state) => state.graph.graph);
  data = convertToD3Graph(graph);
  data = attachLabelsToEdges(data);
  data.nodes.map((node) => {
    return beautifyNodes(node);
  });

  disableDefaultArrowKeysBehaviour();

  return (
    <Suspense fallback={<ProgressBar />}>
      <Card title="Citation Graph" actions={Legends}>
        <ForceGraph3D
          controlType="fly"
          width={window.innerWidth / 2.2}
          height={window.innerHeight / 2}
          ref={addUnrealBloomPass}
          graphData={data}
          nodeThreeObject={makeCustomNodes}
          onNodeClick={handleSelectedNode}
          backgroundColor="#101020"
          linkThreeObject={generateBrightLinks}
          cooldownTime={Infinity}
        />
      </Card>
    </Suspense>
  );
};

export default CitationGraph;

const generateBrightLinks = (link) => {
  const linkColors = new Float32Array([255, 255, 255]);
  const material = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(2 * 3), 3)
  );
  geometry.setAttribute("color", new BufferAttribute(linkColors, 3));

  return new Line(geometry, material);
};
const handleSelectedNode = (node, event) => {
  store.dispatch(changeSelectedNode({ node: node.attributes }));
};
const makeCustomNodes = (node) => {
  var truncated_id = truncate(node.id, 25);
  const sprite = generateSpriteText(truncated_id, node);

  const mesh = generateNodeGeometry(node);

  var group = new Group();
  group.add(sprite, mesh);
  return group;
};

const addUnrealBloomPass = (ref) => {
  if (ref !== null) {
    ref.d3Force("link").distance((link) => 500);

    var bloomPassObject = ref
      .postProcessingComposer()
      .passes.find((x) => x instanceof UnrealBloomPass);

    // if the render passes do not contain a bloom object then add it
    if (!bloomPassObject) {
      bloomPassObject = new UnrealBloomPass();
      setBloomParameters(bloomPassObject);
      ref.postProcessingComposer().addPass(bloomPassObject);
    }
  }
};

function setBloomParameters(bloomPassObject) {
  bloomPassObject.strength = 0.3;
  bloomPassObject.radius = 0.2;
  bloomPassObject.exposure = 0.7;
  bloomPassObject.threshold = 0.1;
}

function disableDefaultArrowKeysBehaviour() {
  window.addEventListener(
    "keydown",
    function (e) {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1
      ) {
        e.preventDefault();
      }
    },
    false
  );
}

function generateNodeGeometry(node) {
  const material = new MeshBasicMaterial({ color: node.node_color });

  const mesh = new Mesh(node.geometry, material);
  return mesh;
}

function generateSpriteText(truncated_id, node) {
  const sprite = new SpriteText(truncated_id);
  sprite.color = node.text_color;
  sprite.textHeight = 18;
  sprite.position.y = 11;
  return sprite;
}

function truncate(str, n) {
  return str.length > n ? str.substr(0, n - 1) + "..." : str;
}
const Legends = [
  <Row>
    <Col>
      <img src={circle_node} width="20px" alt="" /> - References
    </Col>
    <Col>
      <img src={cone_node} width="20px" alt="" /> - Citations
    </Col>
  </Row>,
  <Row>
    <Col>
      <p>
        <span className="yellow-text"> Yellow </span>and{" "}
        <span className="green-text">Green</span> denote{" "}
        <span className="red-text">private </span>access papers.
      </p>
    </Col>
    <Col>
      <p>
        <span className="purple-text">Purple </span>and{" "}
        <span className="blue-text">Blue </span> denote{" "}
        <span className="orange-text">public </span> access papers.
      </p>
    </Col>
  </Row>,
];
