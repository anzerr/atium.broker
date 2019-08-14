
import * as events from 'events';

declare namespace conductorSocket {
	interface ClientConfig {
		api: string;
		socket: string;
		type: string;
        tasks: string[];
    }

	interface ServerConfig {
		api: string;
		socket: string;
    }

	class Server {

        constructor(options: ServerConfig);

        pool(): Promise<boolean>;

    }

	class Client {

		id: string;
		isAlive: boolean;
		config: ClientConfig;

        constructor(options: ClientConfig);

        reconnect(): void;

		send(action: string, data: any): Promise<any>;

		subscribe(channel: string): Promise<any>
		sub(channel: string): Promise<any>

		unsubscribe(channel: string): Promise<any>
		unsub(channel: string): Promise<any>

		event(channel: string, message: any): Promise<any>

		lock(): Promise<any>;

		tasks(t: any): Promise<any>;

		unlock(): Promise<any>;

		who(): Promise<any>;

		close(): void;

	}

	class Task extends events {

		config: ClientConfig;
		who: string;
		private _client: any;

        constructor(options: ClientConfig);

		init(): Promise<void>;

		unlock(): Task;

		lock(): Task;

		subscribe(channel: string): Promise<any>
		sub(channel: string): Promise<any>

		unsubscribe(channel: string): Promise<any>
		unsub(channel: string): Promise<any>

		event(channel: string, message: any): Promise<any>

		log(l: any[]): any;

		run(task: any): Promise<any | void>

		close(): void

	}

}

export as namespace conductorSocket;
export = conductorSocket;