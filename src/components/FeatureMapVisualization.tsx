import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';

type Feature = {
  featureId: string;
  featureName: string;
  userSummary: string;
  aiSummary: string;
  filenames: string[];
  neighbors: string[];
};

export default function FeatureMapVisualization({ features }: { features: Feature[] }) {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!features || features.length === 0) return;

    // Calculate layout positions (simple grid layout)
    const columns = Math.ceil(Math.sqrt(features.length));
    const xSpacing = 300;
    const ySpacing = 250;

    const newNodes: Node[] = features.map((feature, idx) => ({
      id: feature.featureId,
      type: 'default',
      data: {
        label: (
          <div className="px-4 py-2">
            <div className="font-semibold text-sm">{feature.featureName}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {feature.filenames?.length || 0} files
            </div>
          </div>
        ),
      },
      position: {
        x: (idx % columns) * xSpacing,
        y: Math.floor(idx / columns) * ySpacing,
      },
      style: {
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'hsl(var(--foreground))',
        width: 200,
      },
    }));

    // Create edges from neighbors
    const newEdges: Edge[] = features.flatMap((feature) =>
      (feature.neighbors || []).map((neighborId) => ({
        id: `${feature.featureId}-${neighborId}`,
        source: feature.featureId,
        target: neighborId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--primary))' },
      }))
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [features, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const feature = features.find((f) => f.featureId === node.id);
    if (feature) {
      setSelectedFeature(feature);
    }
  }, [features]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!features || features.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Map</CardTitle>
          <CardDescription>No features found. Connect a repository to generate the feature map.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Feature Map</CardTitle>
          <CardDescription>
            Visual representation of your repository's features. Click on a feature to see details.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-full pb-4">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </CardContent>
      </Card>

      {/* Feature Details Dialog */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFeature?.featureName}</DialogTitle>
            <DialogDescription>Feature details and associated files</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">What it does (Non-technical)</h4>
              <p className="text-sm text-muted-foreground">{selectedFeature?.userSummary}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">How it works (Technical)</h4>
              <p className="text-sm text-muted-foreground">{selectedFeature?.aiSummary}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Associated Files</h4>
              <div className="flex flex-wrap gap-2">
                {selectedFeature?.filenames?.map((file, idx) => (
                  <Badge key={idx} variant="secondary" className="font-mono text-xs">
                    {file}
                  </Badge>
                ))}
              </div>
            </div>

            {selectedFeature?.neighbors && selectedFeature.neighbors.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Connected Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFeature.neighbors.map((neighborId) => {
                    const neighbor = features.find((f) => f.featureId === neighborId);
                    return neighbor ? (
                      <Badge key={neighborId} variant="outline">
                        {neighbor.featureName}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
