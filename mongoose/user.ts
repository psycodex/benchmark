import {model, Schema, Model, Document} from 'mongoose';

export interface IUser extends Document {
    id: number;
    id2: number;
    ready: boolean;
    priority: number;
    name: string;
}

const UserSchema: Schema = new Schema({
    id: {type: Number, required: false},
    id2: {type: Number, required: false},
    ready: {type: Boolean, required: false},
    priority: {type: Number, required: false},
    name: {type: String, required: false}
});

export const User: Model<IUser> = model('User', UserSchema);
