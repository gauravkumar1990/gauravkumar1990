pub const Node=struct{id:u64,kind:[]const u8,props_json:[]const u8,children:[]const Node};
pub const MutationTag=enum{create,update,remove,move};
pub const Mutation=struct{tag:MutationTag,node_id:u64,parent_id:?u64=null,payload_json:[]const u8="{}"};
pub const NativeEvent=struct{callback_id:u64,payload_json:[]const u8};
