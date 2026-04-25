import { CanvasTexture, Color, MeshBasicMaterial, Sprite, SpriteMaterial, Vector3 } from 'three';
import { Graph } from '../../../graph/types/graph';
import { PlanaritySceneBase } from '../planarity-testing-editor-scene/planarity-scene-base';
import { PlanaritySceneRenderController } from '../planarity-testing-editor-scene/planarity-scene-render-controller';
import { PlanaritySceneSelectionManager } from '../planarity-testing-editor-scene/planarity-scene-selection-manager';
import { createLabelSprite } from '../../utils';

export class PlanarityEulersFormulaScene extends PlanaritySceneBase {
  private selectionManager: PlanaritySceneSelectionManager;
  private renderController: PlanaritySceneRenderController;

  constructor(canvasElement: HTMLCanvasElement) {
    super(canvasElement);

    this.selectionManager = new PlanaritySceneSelectionManager();
    this.renderController = new PlanaritySceneRenderController(this, this.selectionManager);

    const graph = PLANARITY_EULERS_FORMULA_SCENE_GRAPH;
    const renderingResult = this.renderController.render(graph);
    renderingResult[0].nodeMeshes.forEach((nodeMesh) => {
      if (nodeMesh.id < 14) {
        (nodeMesh.mesh.material as MeshBasicMaterial).color = new Color(0, 0, 255);
      } else {
        nodeMesh.mesh.visible = false;
        nodeMesh.label.visible = false;
      }
      nodeMesh.mesh.position.z += 0.01;

      if (nodeMesh.id >= 4 && nodeMesh.id <= 13) {
        const tmp = createLabelSprite(`${nodeMesh.id - 4}`);
        tmp.position.copy(nodeMesh.label.position);
        renderingResult[0].graphGroup.remove(nodeMesh.label);
        renderingResult[0].graphGroup.add(tmp);
        nodeMesh.label = tmp;
      }
    });
    renderingResult[0].edgeLines.forEach((edgeLine) => {
      if (edgeLine.id !== '14,15') {
        (edgeLine.line.material as MeshBasicMaterial).color = new Color(0, 255, 0);
      } else {
        (edgeLine.line.material as MeshBasicMaterial).color = new Color(255, 255, 255);
      }
    });

    const color = 'rgba(255, 153, 0, 0.6)';
    const facesGraphOne = [this.createRectLabelSprite('1', color), this.createRectLabelSprite('2', color), this.createRectLabelSprite('3', color)];
    const facesGraphTwo = [this.createRectLabelSprite('1', color), this.createRectLabelSprite('2', color)];

    facesGraphOne[0].position.copy(new Vector3(0.3973989862531843, 3.681744247597637, 2));
    facesGraphOne[1].position.copy(new Vector3(0.646937330012853, 2.371268708774201, 2));
    facesGraphOne[2].position.copy(new Vector3(0.646937330012853, 1.371268708774201, 2));

    facesGraphTwo[0].position.copy(new Vector3(4.156992592575804, 3.9330985422805456, 2));
    facesGraphTwo[1].position.copy(new Vector3(5.189157504831844, 2.009853540690088, 2));

    const textOne = this.createColoredText([
      { text: '4', color: 'blue' },
      { text: ' - ', color: 'gray' },
      { text: '5', color: 'green' },
      { text: ' + ', color: 'gray' },
      { text: '3', color: color },
      { text: ' = 2', color: 'gray' },
    ]);
    textOne.position.copy(new Vector3(0.7, -0.85, 2));

    const textTwo = this.createColoredText([
      { text: '10', color: 'blue' },
      { text: ' - ', color: 'gray' },
      { text: '10', color: 'green' },
      { text: ' + ', color: 'gray' },
      { text: '2', color: color },
      { text: ' = 2', color: 'gray' },
    ]);
    textTwo.position.copy(new Vector3(5.8, -0.85, 2));

    this.renderController.applyRenderingResult(renderingResult, false, 250, true, false);
    renderingResult[0].graphGroup.add(...facesGraphOne, ...facesGraphTwo, textOne, textTwo);

    renderingResult[0].graphGroup.position.z += 12;
    this.controls.enabled = false;
    this.controls.update();
  }

  private createRectLabelSprite(text: string, colorString: string = 'rgba(0,0,0,0.6)'): Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = colorString;
    ctx.beginPath();
    ctx.rect(0, 0, 128, 128);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas);

    const material = new SpriteMaterial({ map: texture, transparent: true, depthTest: false });

    const sprite = new Sprite(material);
    sprite.scale.set(0.25, 0.25, 0.25);

    return sprite;
  }

  private createColoredText(segments: TextSegment[]): Sprite {
    const fontSize = 20;
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

export const PLANARITY_EULERS_FORMULA_SCENE_GRAPH: Graph = JSON.parse(
  `{"nodes":[{"id":0,"x":-0.20390416170596204,"y":-0.24899125983561765},{"id":1,"x":1.5378741277261048,"y":1.390284681117323},{"id":2,"x":-0.8748113546723877,"y":2.31963797047647},{"id":3,"x":0.7637504435340756,"y":3.4555142130265395},{"id":4,"x":4.2215028995918065,"y":2.384176393348633},{"id":5,"x":4.82789978554223,"y":3.003745252921399},{"id":6,"x":5.976183250427072,"y":3.1328220986657245},{"id":7,"x":6.95673991707031,"y":2.5519762928162573},{"id":8,"x":7.447018250391928,"y":1.8678690103713294},{"id":9,"x":7.305095574956724,"y":1.0546848821820753},{"id":10,"x":6.6083842591838975,"y":0.4738390763326077},{"id":11,"x":5.2794719346542465,"y":0.35766991516271407},{"id":12,"x":4.389229697833413,"y":0.7449004523956927},{"id":13,"x":4.144090531172603,"y":1.6484383726059748},{"id":14,"x":2.734514241041579,"y":7.9972788040945515},{"id":15,"x":2.7271167698380303,"y":-5.200468703489182},{"id":16,"x":-0.6554763108179786,"y":3.6878525353663263},{"id":17,"x":0.4153947856476625,"y":2.629422400262853},{"id":18,"x":0.27347211021245643,"y":1.1579463587775363},{"id":19,"x":4.234404960995007,"y":3.9589139114294105},{"id":20,"x":5.253667811847846,"y":2.138930386434414}],"edges":[{"id":"0,1","value":[0,1]},{"id":"0,2","value":[0,2]},{"id":"1,2","value":[1,2]},{"id":"1,3","value":[1,3]},{"id":"2,3","value":[2,3]},{"id":"5,6","value":[5,6]},{"id":"6,7","value":[6,7]},{"id":"7,8","value":[7,8]},{"id":"8,9","value":[8,9]},{"id":"9,10","value":[9,10]},{"id":"10,11","value":[10,11]},{"id":"4,13","value":[4,13]},{"id":"12,13","value":[12,13]},{"id":"11,12","value":[11,12]},{"id":"14,15","value":[14,15]},{"id":"4,5","value":[4,5]}]}`
);
