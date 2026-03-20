"""
Reproduce the WORKING wiggling ninja export, but with optimization disabled for more keyframes.
"""
import bpy, os

bpy.ops.wm.read_factory_settings(use_empty=True)
pack_dir = "/Users/amlug/Downloads/Longbow Locomotion Pack"

# Import character
bpy.ops.import_scene.fbx(filepath=os.path.join(pack_dir, "Ch24_nonPBR.fbx"))
arm_obj = mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE': arm_obj = obj
    if obj.type == 'MESH' and len(obj.data.vertices) > 100: mesh_obj = obj

# Import run animation
bpy.ops.import_scene.fbx(filepath=os.path.join(pack_dir, "standing run forward.fbx"))
walk_arm = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o != arm_obj][0]
run_action = max(bpy.data.actions, key=lambda a: a.frame_range[1] - a.frame_range[0])
print(f"Run: frames={run_action.frame_range}")

# Delete walk armature
bpy.data.objects.remove(walk_arm, do_unlink=True)

# Assign run action to character armature
if not arm_obj.animation_data: arm_obj.animation_data_create()
arm_obj.animation_data.action = run_action

# Push to NLA track
track = arm_obj.animation_data.nla_tracks.new()
track.name = "Run"
strip = track.strips.new("Run", int(run_action.frame_range[0]), run_action)
arm_obj.animation_data.action = None

# Clean actions (keep only the run)
for a in list(bpy.data.actions):
    if a != run_action:
        bpy.data.actions.remove(a)
run_action.use_fake_user = True

# Decimate
vc = len(mesh_obj.data.vertices)
if vc > 3000:
    bpy.context.view_layer.objects.active = mesh_obj
    mod = mesh_obj.modifiers.new(name="Dec", type='DECIMATE')
    mod.ratio = 2000.0 / vc
    bpy.ops.object.modifier_apply(modifier="Dec")
    print(f"Decimated: {vc} → {len(mesh_obj.data.vertices)}")

# Apply armature scale (this is what made the wiggling ninja work)
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Remove extras
for obj in list(bpy.data.objects):
    if obj not in (mesh_obj, arm_obj):
        bpy.data.objects.remove(obj, do_unlink=True)

# Export with NLA_TRACKS + optimization DISABLED + force sampling
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets/models/character_walk.glb")
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB',
    export_animations=True, export_skins=True, export_apply=False,
    export_texcoords=True, export_normals=True, export_image_format='JPEG',
    export_animation_mode='NLA_TRACKS', export_nla_strips_merged_animation_name='Run',
    export_optimize_animation_size=False, export_optimize_animation_keep_anim_armature=True,
    export_force_sampling=True)
print("Done!")
