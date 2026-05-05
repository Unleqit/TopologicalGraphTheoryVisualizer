import { MeshBasicMaterial, Color, CanvasTexture, Sprite, SpriteMaterial, Vector3 } from 'three';
import { Graph } from '../../../graph/types/graph';
import { PlanaritySceneBase } from '../planarity-editor-scene/planarity-scene-base';
import { PlanaritySceneHistoryManager } from '../planarity-editor-scene/planarity-scene-history-manager';
import { PlanaritySceneInteractionController } from '../planarity-editor-scene/planarity-scene-interaction-controller';
import { PlanaritySceneRenderController } from '../planarity-editor-scene/planarity-scene-render-controller';
import { PlanaritySceneSelectionManager } from '../planarity-editor-scene/planarity-scene-selection-manager';
import { PlanaritySceneUIController } from '../planarity-editor-scene/planarity-scene-ui-controller';

export class PlanarityTestingScene extends PlanaritySceneBase {
  private selectionManager: PlanaritySceneSelectionManager;
  private renderController: PlanaritySceneRenderController;
  private interactionController: PlanaritySceneInteractionController;
  private historyManager: PlanaritySceneHistoryManager;
  private uiController: PlanaritySceneUIController;

  constructor(canvasElement: HTMLCanvasElement) {
    super(canvasElement);
    this.selectionManager = new PlanaritySceneSelectionManager();
    this.renderController = new PlanaritySceneRenderController(this, this.selectionManager);
    this.historyManager = new PlanaritySceneHistoryManager(
      () => {},
      () => {}
    );
    this.uiController = new PlanaritySceneUIController(
      () => {},
      () => {}
    );
    this.interactionController = new PlanaritySceneInteractionController(this, this.selectionManager, this.renderController, this.historyManager, this.uiController);
    const graph = PLANARITY_TESTING_SCENE_GRAPH;
    const renderingResult = this.renderController.render(graph);
    renderingResult[0].nodeMeshes.forEach((nodeMesh) => {
      nodeMesh.label.visible = false;
      nodeMesh.mesh.position.z += 0.01;
    });

    const redLines = ['40,41', '32,34', '36,37', '31,37', '28,38'];
    const blueLines = ['28,41', '29,30', '33,39'];

    renderingResult[0].edgeLines.forEach((edgeLine) => {
      if (redLines.includes(edgeLine.id)) {
        (edgeLine.line.material as MeshBasicMaterial).color = new Color(255, 0, 0);
      } else if (blueLines.includes(edgeLine.id)) {
        (edgeLine.line.material as MeshBasicMaterial).color = new Color(0, 0, 255);
      }
    });

    const color = 'rgba(199, 119, 0, 0.87)';
    const textOne = this.createColoredText([{ text: 'Planar graph', color: color }]);
    textOne.position.copy(new Vector3(-2.2, -3.35, 2));

    const textTwo = this.createColoredText([{ text: 'Planar drawing', color: color }]);
    textTwo.position.copy(new Vector3(4.8, -3.35, 2));

    const textThree = this.createColoredText([
      { text: 'L', color: 'blue' },
      { text: 'R', color: 'red' },
      { text: ' partition', color: color },
    ]);
    textThree.position.copy(new Vector3(13, -3.35, 2));

    this.renderController.applyRenderingResult(renderingResult, false, 250, true, false);
    renderingResult[0].graphGroup.add(textOne, textTwo, textThree);

    this.renderController.applyRenderingResult(renderingResult, false, 250, true, false);
    renderingResult[0].graphGroup.position.z += 4;
    this.controls.update();
  }

  private createColoredText(segments: TextSegment[]): Sprite {
    const fontSize = 40;
    const padding = 10;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    ctx.font = `bold ${fontSize}px sans-serif`;

    // --- measure total width ---
    let totalWidth = 0;
    const widths = segments.map((seg) => {
      const w = ctx.measureText(seg.text).width;
      totalWidth += w;
      return w;
    });

    const height = fontSize * 1.5;

    canvas.width = totalWidth + padding * 2;
    canvas.height = height + padding * 2;

    // reset after resize
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = 'middle';

    // optional transparent background (keep yours if needed)
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- draw segments ---
    let x = padding;
    const y = canvas.height / 2;

    segments.forEach((seg, i) => {
      ctx.fillStyle = seg.color;
      ctx.fillText(seg.text, x, y);
      x += widths[i];
    });

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new SpriteMaterial({ map: texture, transparent: true, depthTest: false });

    const sprite = new Sprite(material);

    const scaleFactor = 0.01;
    sprite.scale.set(canvas.width * scaleFactor, canvas.height * scaleFactor, 1);

    return sprite;
  }
}

type TextSegment = { text: string; color: string };

export const PLANARITY_TESTING_SCENE_GRAPH: Graph = JSON.parse(
  `{"nodes":[{"id":0,"x":-3.8053349833758707,"y":-0.9959149840797563},{"id":1,"x":-2.069802704684265,"y":-0.6824184160310915},{"id":2,"x":-3.2027196088301757,"y":0.3304166499722878},{"id":3,"x":-4.721310352685331,"y":0.2339561674957764},{"id":4,"x":-4.301379058503144,"y":1.7302942762391869},{"id":5,"x":-0.28240432480614386,"y":0.2021215329647248},{"id":6,"x":-1.7950811618433855,"y":0.9587895903142161},{"id":7,"x":-5.10220797222874,"y":2.7836949050982804},{"id":8,"x":-3.841643941364376,"y":3.288140276664608},{"id":9,"x":-3.263267503673667,"y":2.3831059335603153},{"id":10,"x":-1.85440182211937,"y":3.911278676834778},{"id":11,"x":-2.0471939680162645,"y":2.516635590739637},{"id":12,"x":-0.47519647070306537,"y":3.0210809623059647},{"id":13,"x":0.1328402971256364,"y":1.7599675333901459},{"id":14,"x":4.5640447165420595,"y":-1.7276391238724824},{"id":15,"x":4.529322451969278,"y":-0.5291989013435692},{"id":16,"x":5.275851140284077,"y":0.02659946272781344},{"id":17,"x":5.43210133086159,"y":0.8429283099576498},{"id":18,"x":3.9216828219456055,"y":0.7908222133259607},{"id":19,"x":4.633489245687622,"y":1.8676815437142587},{"id":20,"x":6.0571020931716575,"y":2.2497929190133323},{"id":21,"x":5.136962081992952,"y":2.9445408741025565},{"id":22,"x":3.3661265887811007,"y":2.7013790898213283},{"id":23,"x":1.907791476724284,"y":2.4061112089084076},{"id":24,"x":3.695988102222521,"y":3.639288829191785},{"id":25,"x":6.716825120054506,"y":3.6392888291917846},{"id":26,"x":7.098770030355103,"y":2.6492729931896357},{"id":27,"x":8.192521364397717,"y":3.1008591639976317},{"id":28,"x":13.202020363140797,"y":-2.7813605926705183},{"id":29,"x":13.259477008551908,"y":-1.0569099816522893},{"id":30,"x":12.646606124166873,"y":0.3418110695069325},{"id":31,"x":13.814891247525832,"y":-0.3479691749003555},{"id":32,"x":13.91065232321098,"y":0.4759350059194629},{"id":33,"x":13.087107072318611,"y":1.4531236854964569},{"id":34,"x":14.50459872159423,"y":1.9512499311507214},{"id":35,"x":13.508455805333314,"y":2.985968673068209},{"id":36,"x":15.002556315157044,"y":3.4266132316885356},{"id":37,"x":15.538818338994002,"y":2.2961400533543657},{"id":38,"x":16.77557819225963,"y":2.889786103134615},{"id":39,"x":12.05808789017679,"y":2.4473286328273476},{"id":40,"x":12.378702841383646,"y":3.560737168101066},{"id":41,"x":10.495419227611833,"y":1.9753739978329303}],"edges":[{"id":"0,1","value":[0,1]},{"id":"0,2","value":[0,2]},{"id":"0,3","value":[0,3]},{"id":"2,4","value":[2,4]},{"id":"3,4","value":[3,4]},{"id":"1,3","value":[1,3]},{"id":"2,6","value":[2,6]},{"id":"1,5","value":[1,5]},{"id":"4,7","value":[4,7]},{"id":"4,8","value":[4,8]},{"id":"7,8","value":[7,8]},{"id":"4,9","value":[4,9]},{"id":"8,10","value":[8,10]},{"id":"9,11","value":[9,11]},{"id":"10,11","value":[10,11]},{"id":"5,11","value":[5,11]},{"id":"6,12","value":[6,12]},{"id":"6,13","value":[6,13]},{"id":"5,13","value":[5,13]},{"id":"12,13","value":[12,13]},{"id":"10,12","value":[10,12]},{"id":"14,15","value":[14,15]},{"id":"15,16","value":[15,16]},{"id":"16,17","value":[16,17]},{"id":"17,19","value":[17,19]},{"id":"18,19","value":[18,19]},{"id":"15,18","value":[15,18]},{"id":"17,20","value":[17,20]},{"id":"19,20","value":[19,20]},{"id":"19,21","value":[19,21]},{"id":"19,22","value":[19,22]},{"id":"22,23","value":[22,23]},{"id":"14,23","value":[14,23]},{"id":"23,24","value":[23,24]},{"id":"21,24","value":[21,24]},{"id":"22,24","value":[22,24]},{"id":"14,27","value":[14,27]},{"id":"16,26","value":[16,26]},{"id":"26,27","value":[26,27]},{"id":"25,26","value":[25,26]},{"id":"25,27","value":[25,27]},{"id":"21,25","value":[21,25]},{"id":"28,29","value":[28,29]},{"id":"29,31","value":[29,31]},{"id":"31,32","value":[31,32]},{"id":"32,33","value":[32,33]},{"id":"30,33","value":[30,33]},{"id":"29,30","value":[29,30]},{"id":"28,41","value":[28,41]},{"id":"39,41","value":[39,41]},{"id":"40,41","value":[40,41]},{"id":"39,40","value":[39,40]},{"id":"35,40","value":[35,40]},{"id":"33,39","value":[33,39]},{"id":"33,35","value":[33,35]},{"id":"33,34","value":[33,34]},{"id":"32,34","value":[32,34]},{"id":"31,37","value":[31,37]},{"id":"36,37","value":[36,37]},{"id":"37,38","value":[37,38]},{"id":"28,38","value":[28,38]},{"id":"36,38","value":[36,38]},{"id":"35,36","value":[35,36]}]}`
);
