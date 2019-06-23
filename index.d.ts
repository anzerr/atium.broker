
import * as events from 'events';

declare namespace conductorSocket {
	interface ClientConfig {
		conductor: string;
		socket: string;
		type: string;
        tasks: string[];
    }

	interface ServerConfig {
		conductor: string;
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

		unlock(): Task;

		lock(): Task;

		log(l: any[]): any;

		run(task: any): Promise<object>

		close(): void

	}

}

export as namespace conductorSocket;
export = conductorSocket;